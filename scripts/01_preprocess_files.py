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
# note this will also work for kmls, but may only transform the first layer within the kml. it can read the zipped kmz.
# use ogrinfo path/to/file.kml to see those layers
def vector_to_geojson(src: Path, dst: Path, layer: str | None = None,
                       where: str | None = None):
    """Convert any OGR-readable vector source to GeoJSON in TARGET_CRS."""
    dst.parent.mkdir(parents=True, exist_ok=True) # will create dir if not exist.
    cmd = ["ogr2ogr", "-f", "GeoJSON", "-overwrite", "-t_srs", TARGET_CRS]
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



# input layers to process
    """
    (RAW_DIR / "" / "" / ".shp",
     PROCESSED_DIR / "" / "" / ".geojson"),
    """
LAYERS = [

    (RAW_DIR / "canada" / "CanVec_Hydrographic_Features/canvec_1M_CA_Hydro/" / "permanent_snow_and_ice_2.shp",
     PROCESSED_DIR / "canada" / "CanVec_Hydrographic_Features" / "permanent_snow_and_ice_2.geojson"),

    (RAW_DIR / "canada" / "CanVec_Hydrographic_Features/canvec_1M_CA_Hydro/" / "water_linear_flow_1.shp",
     PROCESSED_DIR / "canada" / "CanVec_Hydrographic_Features" / "water_linear_flow_1.geojson"),

    (RAW_DIR / "canada" / "CanVec_Hydrographic_Features/canvec_1M_CA_Hydro/" / "waterbody_2.shp",
     PROCESSED_DIR / "canada" / "CanVec_Hydrographic_Features" / "waterbody_2.geojson"),

    (RAW_DIR / "canada" / "CanVec_Hydrographic_Features/canvec_1M_CA_Hydro/" / "watercourse_1.shp",
     PROCESSED_DIR / "canada" / "CanVec_Hydrographic_Features" / "watercourse_1.geojson"),

]

def process_layers():
    for src, dst in LAYERS:
        print(f"{src.name} -> {dst.name}")
        try:
            vector_to_geojson(src, dst)
        except Exception as e:
            print(f"  FAILED: {e}")

def main():
    process_layers()

if __name__ == "__main__":
    main()
