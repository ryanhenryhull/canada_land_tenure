# Ryan Hull
# Quantitative Biodiversity Lab, McGill University

# Cloudfare R2 Public Development URL:
# https://pub-5ac3c27e0001486290fb4f649e61b4a8.r2.dev

from pathlib import Path
from datetime import datetime, timezone

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
        bounds = src.bounds
        bbox = [bounds.left, bounds.bottom, bounds.right, bounds.top]
        footprint = {
            "type": "Polygon",
            "coordinates": [[
                [bounds.left, bounds.bottom],
                [bounds.left, bounds.top],
                [bounds.right, bounds.top],
                [bounds.right, bounds.bottom],
                [bounds.left, bounds.bottom],
            ]],
        }
    return bbox, footprint


def build_item(cog_path: Path) -> pystac.Item:
    item_id = cog_path.stem
    bbox, footprint = get_cog_bbox_and_footprint(cog_path)

    item = pystac.Item(
        id=item_id,
        geometry=footprint,
        bbox=bbox,
        datetime=datetime.now(timezone.utc),
        properties={},
    )

    # COG asset
    item.add_asset(
        "cog",
        pystac.Asset(
            href=f"{R2_BASE_URL}/cogs/{cog_path.name}",
            media_type=pystac.MediaType.COG,
            roles=["data"],
            title="Cloud-Optimized GeoTIFF",
        ),
    )

    # Matching PMTiles asset, if one exists with the same stem
    pmtiles_path = PMTILES_DIR / f"{item_id}.pmtiles"
    if pmtiles_path.exists():
        item.add_asset(
            "pmtiles",
            pystac.Asset(
                href=f"{R2_BASE_URL}/pmtiles/{pmtiles_path.name}",
                media_type="application/vnd.pmtiles",
                roles=["data", "visual"],
                title="PMTiles vector tiles",
            ),
        )

    return item


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
        item = build_item(cog_file)
        catalog.add_item(item)
        print(f"Added item: {item.id}")

    return catalog


def main():
    catalog = build_catalog()
    catalog.normalize_hrefs(str(STAC_DIR))
    catalog.save(catalog_type=pystac.CatalogType.SELF_CONTAINED)
    print(f"STAC catalog saved to: {STAC_DIR}")


if __name__ == "__main__":
    main()
