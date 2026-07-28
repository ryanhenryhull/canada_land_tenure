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




# 1. CPCAD
# note that there is a comments attribute table in the .gdb that will be lost here.

def process_cpcad():
    """ CPCAD protected areas dataset comes in a .gdb"""
    src = RAW_DIR / "canada"/ "cpcad" / "ProtectedConservedArea_2025.gdb"
    dst = PROCESSED_DIR / "canada"/ "ProtectedConservedArea_2025.geojson"
    vector_to_geojson(src, dst, layer="ProtectedConservedArea_2025")

def process_cpcad_delisted():
    """ CPCAD delisted protected areas dataset from .gdb"""
    src = RAW_DIR / "canada"/ "cpcad" / "ProtectedConservedArea_2025.gdb"
    dst = PROCESSED_DIR / "canada"/ "ProtectedConservedAreaDelisted_2025.geojson"
    vector_to_geojson(src, dst, layer="ProtectedConservedAreaDelisted_2025")


# 2. Native lands 
def process_native_lands():
    """Indigenous/Native lands, currently in a .shp"""
    src = RAW_DIR / "canada"/ "AL_TA_CA_SHP_eng" / "AL_TA_CA_2_185_eng.shp"
    dst = PROCESSED_DIR / "canada"/ "aboriginal_lands_canada_legislative_boundaries.geojson"
    vector_to_geojson(src, dst)

# 3. BC Parcel Fabric of titled and crown land parcels. This thing is massive.
def process_bc_parcel_fabric(): 
    """currently in a .gdb"""
    src=RAW_DIR / "british_columbia" / "pmbc_parcel_fabric_poly_svw.gdb" # Layer: PMBC_PARCEL_FABRIC_POLY_SVW (Multi Polygon)
    dst=PROCESSED_DIR/ "british_columbia" / "BC_Parcel_Fabric_Poly.geojson"
    vector_to_geojson(src,dst)

# 4. Federal Real Property
def process_federal_real_property():
    """ currently in a .shp"""
    src1=RAW_DIR/ "canada"/ "federal_real_property"/"Property_FGP_20260720135946_799_a.shp"
    src2=RAW_DIR/ "canada"/ "federal_real_property"/"Property_FGP_20260720135946_799_p.shp"
    dst1=PROCESSED_DIR/ "canada"/ "federal_real_property_a.geojson"
    dst2=PROCESSED_DIR/ "canada"/ "federal_real_property_p.geojson"
    vector_to_geojson(src1,dst1)
    vector_to_geojson(src2,dst2)

# 5. Alberta Metis Settlement
def process_alberta_metis_settlement():
    """currently in a .shp"""
    src=RAW_DIR/"alberta"/"alberta_metis_settlement"/"Municipal metis settlement public - Métis Settlement.shp"
    dst=PROCESSED_DIR/"alberta"/"alberta_metis_settlement.geojson"
    vector_to_geojson(src,dst)

# 6. Saskatchewan crown easements
def process_saskatchewan_crown_easements():
    """currently in a .shp"""
    src=RAW_DIR/"saskatchewan"/"saskatchewan_crown_conservation_easements"/"Planning - Crown Conservation Easements.shp"
    dst=PROCESSED_DIR/"saskatchewan"/"saskatchewan_crown_conservation_easements.geojson"
    vector_to_geojson(src,dst)

# 7. Nova Scotia protected areas system
def process_ns_prot_area_sys():
    """currently in a .sħp"""
    src=RAW_DIR/"nova_scotia"/"ns_protected_area_system"/"ENV_NS_Prot_Area_Sys_UT83.shp"
    dst=PROCESSED_DIR/"nova_scotia"/"ns_protected_area_system.geojson"
    vector_to_geojson(src,dst)

# 8. Quebec protected areas 
def process_qc_protected_areas():
    """currently in multiple .shp"""
    src1=RAW_DIR/"quebec"/"protected_areas"/"registre_aires_prot"/"AP_REG_S.shp"
    src2=RAW_DIR/"quebec"/"protected_areas"/"registre_aires_prot"/"AP_ZON_S.shp"
    src3=RAW_DIR/"quebec"/"protected_areas"/"registre_aires_prot"/"T_IMP_S.shp"
    dst1=PROCESSED_DIR/"quebec"/"protected_areas"/"AP_REG_S.geojson"
    dst2=PROCESSED_DIR/"quebec"/"protected_areas"/"AP_ZON_S.geojson"
    dst3=PROCESSED_DIR/"quebec"/"protected_areas"/"T_IMP_S.geojson"
    vector_to_geojson(src1,dst1)
    vector_to_geojson(src2,dst2)
    vector_to_geojson(src3,dst3)

# 9. Yukon Land Parcels Polygons
def process_yukon_parcel_polygons():
    """ from shp """
    src=RAW_DIR/"yukon"/"land_parcels_polygons"/"Land_Parcels_Polygon_Surveyed.shp"
    dst=PROCESSED_DIR/"yukon"/"land_parcels_polygons"/"Land_Parcels_Polygon_Surveyed.geojson"
    vector_to_geojson(src,dst)

# 10. Canada census subdivisions polygons
def process_canada_census_subdivisions():
    """ from shp """
    src=RAW_DIR/"canada"/"statscan_census_subdivision_boundaries"/"lcsd000a25a_e.shp"
    dst=PROCESSED_DIR/"canada"/"statscan_census_subdivision_boundaries"/"census_subdivision_boundaries.geojson"
    vector_to_geojson(src,dst)

# 11. Alberta crown land reservations
def process_alberta_crown_land_reservations():
    """ from shp """
    src1=RAW_DIR/"alberta"/"crown_land_reservations"/"CrownLandReservations.shp"
    dst1=PROCESSED_DIR/"alberta"/"crown_land_reservations"/"CrownLandReservations.geojson"
    src2=RAW_DIR/"alberta"/"crown_land_reservations"/"CrownLandReservations_Historical.shp"
    dst2=PROCESSED_DIR/"alberta"/"crown_land_reservations"/"CrownLandReservations_Historical.geojson"
    vector_to_geojson(src1,dst1)
    vector_to_geojson(src2,dst2)

# 12. New Brunswick protected waters
def process_new_brunswick_protected_waters():
    """ from myriad shp """

    src1=RAW_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneA_2017.shp"
    dst1=PROCESSED_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneA_2017.geojson"

    src2=RAW_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneAp_2017.shp"
    dst2=PROCESSED_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneAp_2017.geojson"
    
    src3=RAW_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneB.shp"
    dst3=PROCESSED_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneB.geojson"
    
    src4=RAW_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneC.shp"
    dst4=PROCESSED_DIR/"new_brunswick"/"geonb_pw-bvp_shp"/"Watersheds_ZoneC.geojson"

    vector_to_geojson(src1,dst1)
    vector_to_geojson(src2,dst2)
    vector_to_geojson(src3,dst3)
    vector_to_geojson(src4,dst4)


def main():
    process_yukon_parcel_polygons()
    process_canada_census_subdivisions()
    process_alberta_crown_land_reservations()
    process_new_brunswick_protected_waters()


if __name__ == "__main__":
    main()
