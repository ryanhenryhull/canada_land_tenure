# August 2026
# Ryan Hull, Quantitative Biodiversity Lab, McGill University
# Goal: Create rasterized version of Canada-wide land tenure layer based on 
#       sources collected in data/processed

# libraries
rm(list=ls())
library(sf)
library(dplyr)
library(ggplot2)

# data
aboriginal_land_canada <- st_read("../data/raw/NA_CA_atlas.gpkg")

# Version 1 - With protected areas, simplified

# Version 2 - With protected areas, more precise

# Version 3 - Without protected areas, simplified

# Version 4 - Without protected areas, more precise
