# Ryan Hull
# Quantitative Biodiversity Lab, McGill University

# Cloudfare R2 Public Development URL:
# https://pub-5ac3c27e0001486290fb4f649e61b4a8.r2.dev

# Ryan Hull
# Quantitative Biodiversity Lab, McGill University

from pathlib import Path
from datetime import datetime, timezone
from rasterio.warp import transform_bounds

import pystac
import rasterio

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
STAC_DIR = OUTPUTS_DIR / "stac"

# Replace with your actual R2 public dev URL
R2_BASE_URL = "https://pub-5ac3c27e0001486290fb4f649e61b4a8.r2.dev"

COG_DIR = OUTPUTS_DIR / "cogs"
PMTILES_DIR = OUTPUTS_DIR / "pmtiles"


def get_cog_bbox_and_footprint(cog_path: Path):
    with rasterio.open(cog_path) as src:
        # Reproject bounds to WGS84 (EPSG:4326) — STAC spec requires
        # geometry/bbox to always be in WGS84, regardless of the asset's
        # native CRS (this COG is EPSG:3857 Web Mercator).
        west, south, east, north = transform_bounds(
            src.crs, "EPSG:4326", *src.bounds
        )
        bbox = [west, south, east, north]
        footprint = {
            "type": "Polygon",
            "coordinates": [[
                [west, south],
                [west, north],
                [east, north],
                [east, south],
                [west, south],
            ]],
        }
    return bbox, footprint

# Ryan note: if we wanna have different titles than the filenames, I'll have to make a lookup table and work it in here.
def humanize_title(item_id: str) -> str:
    return item_id.replace("_", " ").replace("-", " ").strip()

def build_cog_item(cog_path: Path) -> pystac.Item:
    item_id = cog_path.stem
    bbox, footprint = get_cog_bbox_and_footprint(cog_path)

    item = pystac.Item(
        id=item_id,
        geometry=footprint,
        bbox=bbox,
        datetime=datetime.now(timezone.utc),
        properties={
            "title": humanize_title(item_id)},
    )

    item.add_asset(
        "cog",
        pystac.Asset(
            href=f"{R2_BASE_URL}/cogs/{cog_path.name}",
            media_type=pystac.MediaType.COG,
            roles=["data"],
            title="Cloud-Optimized GeoTIFF",
        ),
    )

    return item


def build_pmtiles_items() -> list[pystac.Item]:
    items = []
    pmtiles_files = sorted(PMTILES_DIR.rglob("*.pmtiles"))

    if not pmtiles_files:
        print(f"No PMTiles found under {PMTILES_DIR}")

    for pmtiles_path in pmtiles_files:
        item_id = pmtiles_path.stem
        rel_path = pmtiles_path.relative_to(PMTILES_DIR).as_posix()

        # Placeholder bbox (Canada-wide). Replace with actual per-file
        # extent via the `pmtiles` library's header reader if precise
        # spatial bounds are needed for search/filtering.
        bbox = [-141.0, 41.7, -52.6, 83.1]
        footprint = {
            "type": "Polygon",
            "coordinates": [[
                [bbox[0], bbox[1]],
                [bbox[0], bbox[3]],
                [bbox[2], bbox[3]],
                [bbox[2], bbox[1]],
                [bbox[0], bbox[1]],
            ]],
        }

        item = pystac.Item(
            id=item_id,
            geometry=footprint,
            bbox=bbox,
            datetime=datetime.now(timezone.utc),
            properties={
                "title": humanize_title(item_id)},
        )
        item.add_asset(
            "pmtiles",
            pystac.Asset(
                href=f"{R2_BASE_URL}/pmtiles/{rel_path}",
                media_type="application/vnd.pmtiles",
                roles=["data", "visual"],
                title="PMTiles vector tiles",
            ),
        )
        items.append(item)
        print(f"Added PMTiles item: {item.id}")

    return items


def build_catalog() -> pystac.Catalog:
    catalog = pystac.Catalog(
        id="canada-land-tenure",
        description="Canada-wide land tenure COGs and PMTiles for Blitz the Gap",
        title="Canada Land Tenure",
    )

    cog_files = sorted(COG_DIR.glob("*.tif"))
    if not cog_files:
        print(f"No COGs found in {COG_DIR}")

    for cog_file in cog_files:
        item = build_cog_item(cog_file)
        catalog.add_item(item)
        print(f"Added COG item: {item.id}")

    for pmtiles_item in build_pmtiles_items():
        catalog.add_item(pmtiles_item)

    return catalog


def main():
    catalog = build_catalog()
    catalog.normalize_hrefs(str(STAC_DIR))
    catalog.save(catalog_type=pystac.CatalogType.SELF_CONTAINED)
    print(f"STAC catalog saved to: {STAC_DIR}")


if __name__ == "__main__":
    main()
