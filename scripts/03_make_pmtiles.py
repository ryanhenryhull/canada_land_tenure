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




def check_tippecanoe():
    if shutil.which("tippecanoe") is None:
        raise RuntimeError(
            "tippecanoe not found on PATH. Install via:\n"
            "  conda install -c conda-forge tippecanoe"
        )


def geojson_to_pmtiles(src: Path, dst: Path, layer_name: str):
    subprocess.run(
        [
            "tippecanoe",
            "-o", str(dst),
            "-l", layer_name,
            "-z", "10",              # explicit max zoom instead of -zg
            "-Z", "0",                # explicit min zoom
            "--coalesce-densest-as-needed",   # merges instead of dropping
            "--extend-zooms-if-still-dropping",
            "--simplification=10",    # more aggressive line simplification
            "-f",
            str(src),
        ],
        check=True,
    )
    print(f"PMTiles written: {dst}")

def main():
    check_tippecanoe()

    # Collect specific files. name the ones you wanna process.
    sources = [
        PROCESSED_DIR / "manitoba"/ "manitoba_community_agreements.geojson",
        PROCESSED_DIR / "manitoba"/ "manitoba_first_nation_non_TLE_agreements.geojson",
        PROCESSED_DIR / "manitoba"/ "manitoba_first_nation_permit_fee_simple_lands.geojson",
        PROCESSED_DIR / "manitoba"/ "manitoba_treaty_land_entitlement_sites.geojson",
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
