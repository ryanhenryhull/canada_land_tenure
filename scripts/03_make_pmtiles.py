# Ryan Hull
# Quantitative Biodiversity Lab, McGill University
# Goal: Transform geojsons into pmtiles




import subprocess
import shutil
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
OUT_DIR = PROJECT_ROOT / "outputs" / "pmtiles"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---- CONFIG: edit these two lines to control speed vs. detail ----
MAX_ZOOM = 10              # low = fast preview, 10 = full detail
ALLOW_ZOOM_EXTEND = False  # this =True can cause longashell processing .
# --------------------------------------------------------------------

def check_tippecanoe():
    if shutil.which("tippecanoe") is None:
        raise RuntimeError(
            "tippecanoe not found on PATH. Install via:\n"
            "  conda install -c conda-forge tippecanoe"
        )


def geojson_to_pmtiles(src: Path, dst: Path, layer_name: str):
    """ Processes a single geojson source into one pmtiles. Helper function."""
    cmd = [
        "tippecanoe",
        "-o", str(dst),
        "-l", layer_name,
        "-z", str(MAX_ZOOM),
        "-Z", "0",
        "--coalesce-densest-as-needed",
        "--simplification=10",
        "-f",
        str(src),
    ]
    if ALLOW_ZOOM_EXTEND:
        cmd.append("--extend-zooms-if-still-dropping")

    subprocess.run(cmd, check=True)
    print(f"PMTiles written: {dst} (max zoom {MAX_ZOOM}, extend={ALLOW_ZOOM_EXTEND})")


def multi_geojson_to_pmtiles(sources_with_layer_names: list[tuple[Path, str]], dst: Path):
    """Multiple geojsons -> single pmtiles archive, each as its own named vector layer. Helper function."""
    cmd = ["tippecanoe", "-o", str(dst)]
    for src, layer_name in sources_with_layer_names:
        cmd += ["-L", f"{layer_name}:{src}"]
    cmd += [
        "-z", str(MAX_ZOOM),
        "-Z", "0",
        "--coalesce-densest-as-needed",
        "--simplification=10",
        "-f",
    ]
    if ALLOW_ZOOM_EXTEND:
        cmd.append("--extend-zooms-if-still-dropping")
    subprocess.run(cmd, check=True)
    print(f"Combined PMTiles written: {dst} (layers: {[l for _, l in sources_with_layer_names]})")

# Edit these with files to process
def process_separate_geojsons():
    """ Uses geojson_to_pmtiles(src: Path, dst: Path, layer_name: str) to process specified geojsons, 
        each becoming their own pmtiles file.""" 

    check_tippecanoe()
    
    # Collect specific files. name the ones you wanna process.
    sources = [
        PROCESSED_DIR / "quebec"/ "protected_areas" / ".geojson",
        PROCESSED_DIR / "quebec"/ "protected_areas" / ".geojson",
    ]
    
    # Check for missing files
    missing = [src for src in sources if not src.exists()]
    if missing:
        print("Missing:", missing)
        return
    
    # Process existing files
    for src in sources:
        dst = OUT_DIR / f"{src.stem}.pmtiles" # edit this line to change out dir.
        geojson_to_pmtiles(src, dst, layer_name=src.stem)


# Edit these with files to process
def process_related_geojsons():
    """ Uses multi_geojson_to_pmtiles(list of sources, dst) to process specified geojsons. """
    check_tippecanoe()
    
    SRC_DIR = PROCESSED_DIR / "quebec" / "protected_areas"
    sources_with_layer_names = [
        (qc_protected_dir / "AP_REG_S.geojson", "AP_REG_S"),
        (qc_protected_dir / "AP_ZON_S.geojson", "AP_ZON_S"),
        (qc_protected_dir / "T_IMP_S.geojson", "T_IMP_S"),
    ]

    missing = [src for src, _ in sources_with_layer_names if not src.exists()]
    if missing:
        print("Missing:", missing)
        return

    dst = OUT_DIR / "quebec" / "protected_areas.pmtiles"
    dst.parent.mkdir(parents=True, exist_ok=True)

    multi_geojson_to_pmtiles(sources_with_layer_names, dst)



def main():
    
    # process_separate_geojsons()
    # process_related_geojsons()

if __name__ == "__main__":
    main()
