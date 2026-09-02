# August 2026
# Ryan Hull, Quantitative Biodiversity Lab, McGill University
# Goal: Create rasterized version of Canada-wide land tenure layer based on 
#       sources collected in data/processed



# 1. libraries
rm(list=ls())
library(sf)
library(dplyr)
library(ggplot2)
library(terra)
library(foreign)




# 2. constants 
CRS <- "EPSG:3978"
RESOLUTION <- 300

rasterize_presence <- function(sf_list, template) {
  sf_list <- Filter(Negate(is.null), sf_list)
  if (length(sf_list) == 0) return(NULL)
  layer_rasters <- lapply(sf_list, function(layer) {
    layer_proj <- st_transform(layer, CRS)
    rasterize(vect(layer_proj), template, field = 1, background = NA)
  })
  Reduce(terra::cover, layer_rasters)
}



# 3. indigenous land data

aboriginal_land_canada <- st_read("data/raw/NA_CA_atlas.gpkg")

# land governed by the metis settlements general council as per provincial legislation,
# not incl. in aboriginal lands database
ab_metis_settlement <- st_read("data/processed/alberta/alberta_metis_settlement.geojson")

# various forms of indigenous land tenure in Manitoba not extensively covered in 
# the aboriginal lands database
mn_first_nation_other_TLE_acquisitions<- st_read("data/processed/manitoba/manitoba_first_nation_TLE_acquisitions_other.geojson")
mn_first_nation_non_TLE_agreements <- st_read("data/processed/manitoba/manitoba_first_nation_non_TLE_agreements.geojson")
mn_first_nation_permit_fee_simple_lands <- st_read("data/processed/manitoba/manitoba_first_nation_permit_fee_simple_lands.geojson")
mn_treaty_land_entitlement_sites <- st_read("data/processed/manitoba/manitoba_treaty_land_entitlement_sites.geojson")

indigenous_layers <- list(aboriginal_land_canada,
                          ab_metis_settlement,
                          mn_treaty_land_entitlement_sites,
                          mn_first_nation_permit_fee_simple_lands,
                          mn_first_nation_non_TLE_agreements,
                          mn_first_nation_other_TLE_acquisitions)



# 4. protected land data

# canadian database, 2025
cpcad <- st_read("data/processed/canada/ProtectedConservedArea_2025.geojson")

# contains large protected areas not included in cpcad, eg glover's island 
NL_Provincial_Protected_Areas <- st_read("data/processed/newfoundland_labrador/Provincial_Protected_Areas.geojson") 

# contains land trusts and conservation easements not incl. in cpcad
ns_protected_areas_system <- st_read("data/processed/nova_scotia/ns_protected_areas_system.geojson") 

# Quebec protected areas database likely more extensive than cpcad. 
# Select 'Milieu naturel de conservation volontaires'
# in Quebec's not found in cpcad.
qc_protected_areas <- st_read("data/processed/quebec/protected_areas/AP_REG_S.geojson") 
qc_protected_zones <- st_read("data/processed/quebec/protected_areas/AP_ZON_S.geojson")

# both cpcad and below include projected areas, with qc having more. However
# quebec's layer includes identified critical habitats that are not protected
# or planned to be protected, which shouldn't be included.
qc_projected_proteted_areas_and_critical_habitats <- st_read("data/processed/quebec/protected_areas/T_IMP_S.geojson")

# large quantities of sask (private) conservation easements not incl. in cpcad
sk_conservation_easements <- st_read("data/processed/saskatchewan/saskatchewan_conservation_easements.geojson")
# same, to a lesser extent, with crown conservation easements
sk_crown_conservation_easements <- st_read("data/processed/saskatchewan/saskatchewan_crown_conservation_easements.geojson")
# the sask proteted & conserved network shouldn't have anything beyond the above
# two sources and cpcad, but can be included
sk_protected_conserved_network <- st_read("data/processed/saskatchewan/saskatchewan_protected_conserved_network.geojson")

protected_layers <- list(cpcad,
                         NL_Provincial_Protected_Areas,
                         ns_protected_areas_system,
                         qc_protected_areas,
                         qc_protected_zones,
                         sk_conservation_easements,
                         sk_crown_conservation_easements,
                         sk_protected_conserved_network)




# 5. 2020 forest based tenure raster data 

# Use for water, private land, and other tenure & protection categories.
canada_forest_management <- rast("data/processed/canada/canada_forest_management_2020/Canada_MFv2020.tif")
canada_forest_management_vat <- read.dbf("data/processed/canada/canada_forest_management_2020/Canada_MFv2020.tif.vat.dbf")
crs(canada_forest_management) # Albers Equal Area 
res(canada_forest_management) # 250m

# 300m template grid. Use forest management raster's extent and CRS
forest_management_reproj <- project(canada_forest_management, CRS, method = "near")
template  <- rast(ext(forest_management_reproj), resolution = RESOLUTION , crs = CRS)
forest_management_reproj <- resample(forest_management_reproj, template, method = "near")

# generate codes to create categories later (note to check these in the vat) 
water_code <- canada_forest_management_vat$MF_code[
  canada_forest_management_vat$Value == "Water"
  ]

private_code <- canada_forest_management_vat$MF_code[
  canada_forest_management_vat$Value == "Private"
  ]

other_codes <- canada_forest_management_vat$MF_code[
  canada_forest_management_vat$Value %in% c("Restricted","Federal Reserve")
  ]





# 6. Create Version 1: With protected areas, simplified
# Categories, with priority order:
#  1. Water
#  2. Protected Land 
#  3. Indigenous Land
#  4. Private Land
#  5. Other tenure & protection
#  5. Public Land 

# create raster categories
  CATEGORIES_V1 <- c(
  water      = 1L,
  protected  = 2L,
  indigenous = 3L,
  private    = 4L,
  other      = 5L,
  public     = 6L
)

# extract needed categories. Resulting rasters are "binary" of cat code or NA.
water <- ifel(forest_management_reproj == water_code, CATEGORIES_V1["water"], NA) # terra's raster ifelse fn
private <- ifel(forest_management_reproj == private_code, CATEGORIES_V1["private"], NA) 
other <- ifel(forest_management_reproj %in% other_codes, CATEGORIES_V1["other"], NA)

# public: set as all of canada within template. set as the default category.
# init(x, fun) will make a raster with extent and crs of x, and fill it based on fun
public <- init(template, unname(CATEGORIES_V1["public"])) 

# transform vectors 
# rasterize gives 1 when polygon covers cell, NA otherwise.
# then multiply by category code.
protected  <- rasterize_presence(protected_layers, template)  * CATEGORIES_V1["protected"] 
indigenous <- rasterize_presence(indigenous_layers, template) * CATEGORIES_V1["indigenous"]

# create raster
# reduce applies cover pairwise to ensure the ordering
tenure_300m <- Reduce(terra::cover, list(
  water,
  protected,
  indigenous,
  private,
  other,
  public # catches all remaining, ie no NAs
))

# link up the metadata of category names 
levels(tenure_300m) <- data.frame(
  value = unname(CATEGORIES_V1),
  category = names(CATEGORIES_V1)
)

writeRaster(tenure_300m, "raster_layer/outputs/canada_tenure_v1_300m.tif",
            overwrite = TRUE, datatype = "INT1U") # INT1U for 0-255, ie to keep this light vs standard




# 7. Create Version 2 : With protected areas, more precise
# Categories, with priority order:
#  1. Water
#  2. Indigenous land: Aboriginal lands of Canada Legislative Boundaries
#  3. Indigenous land: Other
#  4. Protected areas: CPCAD
#  5. Protected areas: Other
#  6. Private Land
#  7. Public Land 




# 8. Create Version 3 : With protected areas, even more precise


