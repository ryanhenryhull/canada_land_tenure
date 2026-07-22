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



def main():
    check_tippecanoe()

    # Collect specific files. name the ones you wanna process.
    sources = [
        PROCESSED_DIR / "saskatchewan"/ "saskatchewan_conservation_easements.geojson",
        PROCESSED_DIR / "saskatchewan"/ "saskatchewan_crown_conservation_easements..geojson",
        PROCESSED_DIR / "saskatchewan"/ "saskatchewan_protected_and_conserved_area_network.geojson",
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

if __name__ == "__main__":
    main()
