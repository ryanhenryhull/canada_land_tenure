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

R2_BASE_URL = "https://pub-5ac3c27e0001486290fb4f649e61b4a8.r2.dev"

COG_DIR = OUTPUTS_DIR / "cogs"
PMTILES_DIR = OUTPUTS_DIR / "pmtiles"

# Maps folder slug -> display name. Add entries as you add provinces/territories.
# Anything not listed here falls back to title-cased underscores (see humanize_region).
REGION_DISPLAY_NAMES = {
    "canada": "Canada",
    "british_columbia": "British Columbia",
    "alberta": "Alberta",
    "saskatchewan": "Saskatchewan",
    "manitoba": "Manitoba",
    "ontario": "Ontario",
    "quebec": "Quebec",
    "new_brunswick": "New Brunswick",
    "nova_scotia": "Nova Scotia",
    "prince_edward_island": "Prince Edward Island",
    "newfoundland_and_labrador": "Newfoundland and Labrador",
    "yukon": "Yukon",
    "northwest_territories": "Northwest Territories",
    "nunavut": "Nunavut",
}

def humanize_region(region_slug: str) -> str:
    if region_slug in REGION_DISPLAY_NAMES:
        return REGION_DISPLAY_NAMES[region_slug]
    return region_slug.replace("_", " ").replace("-", " ").title()


def get_region_slug(file_path: Path, base_dir: Path) -> str:
    rel = file_path.relative_to(base_dir)
    if len(rel.parts) < 2:
        print(f"Warning: {file_path} has no region subfolder under {base_dir}; defaulting to 'canada'")
        return "canada"
    return rel.parts[0]

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
            "title": humanize_title(item_id),
            "region": humanize_region(region_slug),
            }
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

def build_cog_items() -> list[pystac.Item]:
    items = []
    cog_files = sorted(COG_DIR.rglob("*.tif"))

    if not cog_files:
        print(f"No COGs found under {COG_DIR}")

    for cog_path in cog_files:
        item = build_cog_item(cog_path)
        items.append(item)
        print(f"Added COG item: {item.id} (region: {item.properties['region']})")

    return items


def build_pmtiles_items() -> list[pystac.Item]:
    items = []
    pmtiles_files = sorted(PMTILES_DIR.rglob("*.pmtiles"))

    if not pmtiles_files:
        print(f"No PMTiles found under {PMTILES_DIR}")

    for pmtiles_path in pmtiles_files:
        item_id = pmtiles_path.stem
        rel_path = pmtiles_path.relative_to(PMTILES_DIR).as_posix()
        region_slug = get_region_slug(pmtiles_path, PMTILES_DIR)

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
    
    for cog_item in build_cog_items():
        catalog.add_item(cog_item)

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
