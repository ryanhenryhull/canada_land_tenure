# Ryan Hull
# Quantitative Biodiversity Lab, McGill University
# Turn geotiffs to COGs




import rasterio
from pathlib import Path
from rio_cogeo.cogeo import cog_translate
from rio_cogeo.profiles import cog_profiles



SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
PROCESSED_DIR = PROJECT_ROOT/"data"/"processed" # this already contains only tifs/tiffs.
RASTER_OUTPUTS_DIR = PROJECT_ROOT/"raster_layer"/"outputs"
OUT_DIR = PROJECT_ROOT/"outputs"/"cogs"
RASTER_EXTENSIONS = (".tiff", ".tif")
RESAMPLING = "nearest"
DST_PROFILE = cog_profiles.get("deflate")
OUT_DIR.mkdir(parents=True, exist_ok=True)




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




# Perform transformation. Note currently this does not place the files in their dedicated country or province folder.
""" Loop through all processed tif/tiffs to create the COGs """
def main():
    # note swap RASTER_OUTPUTS_DIR and PROCESSED_DIR depending on source.
    sources = [file for file in RASTER_OUTPUTS_DIR.glob("**/*") if file.suffix.lower() in RASTER_EXTENSIONS]
    if not sources:
        print("no tifs/tiffs found")
        return
    for source in sources:
        make_cog(source, OUT_DIR / f"{source.stem}.tif")


if __name__ == "__main__":
    main()
