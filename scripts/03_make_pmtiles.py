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
            "-zg",
            "--drop-densest-as-needed",
            "--extend-zooms-if-still-dropping",
            "-f",
            str(src),
        ],
        check=True,
    )
    print(f"PMTiles written: {dst}")




def main():

    check_tippecanoe()

    sources = list(PROCESSED_DIR.glob("*.geojson"))
    if not sources:
        print(f"No GeoJSON files found in {PROCESSED_DIR}")
        return

    for src in sources:
        dst = OUT_DIR / f"{src.stem}.pmtiles"
        geojson_to_pmtiles(src, dst, layer_name=src.stem)


if __name__ == "__main__":
    main()
