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



# data

canada_forest_management <- rast("../data/processed/canada_forest_management_2020/Canada_MFv2020.tif")

aboriginal_land_canada <- st_read("../data/raw/NA_CA_atlas.gpkg")




# Version 1 - With protected areas, simplified
# Categories, with priority order:
#  1. Water
#  2. Indigenous Land 
#  3. Protected Land 
#  4. Private Land 
#  5. Public Land 




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
