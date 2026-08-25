# August 2026
# Ryan Hull, Quantitative Biodiversity Lab, McGill University
# Goal: Create rasterized version of Canada-wide land tenure layer based on 
#       sources collected in data/processed



# libraries
rm(list=ls())
library(sf)
library(dplyr)
library(ggplot2)
library(terra)
library(foreign)



# 2020 forest based tenure raster data 
canada_forest_management <- rast("../data/processed/canada_forest_management_2020/Canada_MFv2020.tif")
canada_forest_management_vat <- read.dbf("../data/processed/canada_forest_management_2020/Canada_MFv2020.vat.dbf")



# indigenous lands data
aboriginal_land_canada <- st_read("../data/raw/NA_CA_atlas.gpkg")

# land governed by the metis settlements general council as per provincial legislation,
# not incl. in aboriginal lands database
ab_metis_settlement <- st_read("../data/processed/alberta/alberta_metis_settlement.geojson")

# various forms of indigenous land tenure in manitoba not extensively covered in 
# the aboriginal lands database
mn_first_nation_other_TLE_acquisitions<- st_read("../data/processed/manitoba/manitoba_first_nation_TLE_acquisitions_other.geojson")
mn_first_nation_non_TLE_agreements <- st_read("../data/processed/manitoba/manitoba_first_nation_non_TLE_agreements.geojson")
mn_first_nation_permit_fee_simple_lands <- st_read("../data/processed/manitoba/manitoba_first_nation_permit_fee_simple_lands.geojson")
mn_treaty_land_entitlement_sites <- st_read("../data/processed/manitoba/manitoba_treaty_land_entitlement_sites.geojson")



# protected land data

# canadian database, 2025
cpcad <- st_read("../data/processed/canada/ProtectedConservedArea_2025.geojson")

# contains large protected areas not included in cpcad, eg glover's island 
the <- st_read("../data/processed/newfoundland_labrador/Provincial_Protected_Areas.geojson") 

# contains land trusts and conservation easements not incl. in cpcad
the <- st_read("../data/processed/nova_scotia/ns_protected_areas_system.geojson") 

# Quebec protected areas database likely more extensive than cpcad. Both include
# projected protected areas of sorts, with Quebec's layer (T_IMP_S) including 
# more land. I've also noted select 'Milieu naturel de conservation volontaires'
# in Quebec's not found in cpcad.
the <- st_read("../data/processed/quebec/protected_areas/AP_REG_S.geojson") 
the <- st_read("../data/processed/quebec/protected_areas/AP_ZON_S.geojson")
the <- st_read("../data/processed/quebec/protected_areas/T_IMP_S.geojson")

# large quantities of sask (private) conservation easements not incl. in cpcad
the <- st_read("../data/processed/saskatchewan/saskatchewan_conservation_easements.geojson")
# same, to a lesser extent, with crown conservation easements
the <- st_read("../data/processed/saskatchewan/saskatchewan_crown_conservation_easements.geojson")
# the sask proteted & conserved network shouldn't have anything beyond the above
# two sources and cpcad, but can be included
the <- st_read("../data/processed/saskatchewan/saskatchewan_protected_conserved_network.geojson")



# Version 1 - With protected areas, simplified
# Categories, with priority order:
#  1. Water
#  2. Indigenous Land 
#  3. Protected Land 
#  4. Private Land 
#  5. Public Land 

# what to do with federal reserve (non-indigenous) and restricted areas?



# Version 2 - With protected areas, more precise
# Categories, with priority order:
#  1. Water
#  2. Indigenous land: Aboriginal lands of Canada Legislative Boundaries
#  3. Indigenous land: Other
#  4. Protected areas: CPCAD
#  5. Protected areas: Other
#  6. Private Land
#  7. Public Land 




# Version 3 - With protected areas, even more precise




# Later on, do versions without protected areas
