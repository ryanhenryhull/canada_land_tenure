# Ryan Hull
# Quantitative Biodiversity Lab, McGill University
from pathlib import Path
from google.cloud import storage

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
BUCKET_NAME = "canada_land_tenure_cogs_pmtiles"

UPLOAD_DIRS = {
    "cogs": OUTPUTS_DIR / "cogs",
    "pmtiles": OUTPUTS_DIR / "pmtiles",
}

def upload_file(bucket, local_path: Path, blob_path: str):
    blob = bucket.blob(blob_path)
    blob.upload_from_filename(str(local_path))
    print(f"Uploaded: {local_path} -> gs://{bucket.name}/{blob_path}")

def main():
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    for subdir_name, local_dir in UPLOAD_DIRS.items():
        if not local_dir.exists():
            print(f"Skipping missing dir: {local_dir}")
            continue
        for file in local_dir.glob("**/*"):
            if file.is_file() and not file.name.endswith("-journal"):
                rel_path = file.relative_to(OUTPUTS_DIR)
                blob_path = rel_path.as_posix()
                upload_file(bucket, file, blob_path)

if __name__ == "__main__":
    main()
