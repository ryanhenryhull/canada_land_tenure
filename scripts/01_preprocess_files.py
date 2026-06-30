# Ryan Hull
# Quantitative Biodiversity Lab, McGill University
# Goal: from initial source files, populate data/processed with tifs and geojsons, ready to be cloud optimized and pmtiled.




import subprocess
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
RAW_DIR = PROJECT_ROOT/"data"/"raw" 
PROCESSED_DIR = PROJECT_ROOT/"data"/"processed"
TARGET_CRS = "EPSG:4326"




# Function to create geojsons
def vector_to_geojson(src: Path, dst: Path, layer: str | None = None,
                       where: str | None = None):
    """Convert any OGR-readable vector source to GeoJSON in TARGET_CRS."""
    cmd = ["ogr2ogr", "-f", "GeoJSON", "-t_srs", TARGET_CRS]
    if layer:
        cmd += [str(dst), str(src), layer]
    else:
        cmd += [str(dst), str(src)]
    if where:
        cmd += ["-where", where]
    subprocess.run(cmd, check=True)
    print(f"Wrote {dst}")

# Function to create tiffs
def raster_to_tiff(src: Path, dst: Path, resample: str = "near"):
    """Reproject/convert any GDAL-readable raster to a plain GeoTIFF."""
    cmd = [
        "gdalwarp", "-t_srs", TARGET_CRS, "-r", resample,
        "-overwrite", str(src), str(dst),
    ]
    subprocess.run(cmd, check=True)
    print(f"Wrote {dst}")




# 1. CPCAD
# note that there is a comments attribute table in the .gdb that will be lost here.

def process_cpcad():
    """ CPCAD protected areas dataset comes in a .gdb"""
    src = RAW_DIR / "cpcad" / "ProtectedConservedArea_2025.gdb"
    dst = PROCESSED_DIR / "ProtectedConservedArea_2025.geojson"
    vector_to_geojson(src, dst, layer="ProtectedConservedArea_2025")

def process_cpcad_delisted():
    """ CPCAD delisted protected areas dataset from .gdb"""
    src = RAW_DIR / "cpcad" / "ProtectedConservedArea_2025.gdb"
    dst = PROCESSED_DIR / "ProtectedConservedAreaDelisted_2025.geojson"
    vector_to_geojson(src, dst, layer="ProtectedConservedAreaDelisted_2025")


# 2. Native lands 
#def process_native_lands():
#    """Indigenous/Native lands, currently in a .shp"""
#    src = RAW_DIR / "native_lands" / "native_lands.shp"
#    dst = PROCESSED_DIR / "native_lands.geojson"
#    vector_to_geojson(src, dst)




def main():
    process_cpcad()
    process_cpcad_delisted()
    # the rest, do later.

if __name__ == "__main__":
    main()


