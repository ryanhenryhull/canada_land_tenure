# Ryan Hull
# Quantitative Biodiversity Lab, McGill University
# Turn geotiffs to COGs
import rasterio
from pathlib import Path
from rio_cogeo.cogeo import cog_translate
from rio_cogeo.profiles import cog_profiles

PROCESSED_DIR = Path("data/raw") # this already contains only tifs/tiffs.
OUT_DIR = Path("outputs/cogs")
RASTER_EXTENSIONS = (".tiff", ".tif")
RESAMPLING = "nearest"
DST_PROFILE = cog_profiles.get("deflate")

# 1. Transform to cog
""" This will transform one tif or tiff into a COG"""
def make_cog(src_path: Path, dst_path: Path):
    cog_translate(
        src_path,
        dst_path,
        DST_PROFILE,
        resampling=RESAMPLING,
        overview_resampling=RESAMPLING,
        web_optimized=True,
        add_mask=False,
        quiet=False,
    )
    print(f"COG written: {dst_path}")


# Perform transformation
""" Loop through all processed tif/tiffs to create the COGs """
def main():
    sources = [file for file in PROCESSED_DIR.glob("**/*") if file.suffix.lower() in RASTER_EXTENSIONS]
    if not sources:
        print("no tifs/tiffs found")
        return
    for source in sources:
        make_cog(src, OUT_DIR / f"{src.stem}.tif")


if __name__ == "__main__":
    main()
