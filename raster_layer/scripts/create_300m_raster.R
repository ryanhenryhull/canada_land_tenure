# August 2026
# Ryan Hull, Quantitative Biodiversity Lab, McGill University
# Goal: Create rasterized version of Canada-wide land tenure layer based on 
#       sources collected in data/processed




# 1:
# Libraries
rm(list=ls())
library(sf)
library(dplyr)
library(ggplot2)
library(terra)
library(foreign)




# 2:
# Constants 
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

# set session gdal size processing limit to no limit (0) to allow cpcad to process
Sys.setenv(OGR_GEOJSON_MAX_OBJ_SIZE = "0")




# 3:
# Indigenous land data

aboriginal_land_canada <- st_read("data/processed/canada/aboriginal_lands_canada_legislative_boundaries.geojson")

# land governed by the metis settlements general council as per provincial legislation,
# not incl. in aboriginal lands database
ab_metis_settlement <- st_read("data/processed/alberta/alberta_metis_settlement.geojson")

# various forms of indigenous land tenure in Manitoba not extensively covered in 
# the aboriginal lands database
mn_first_nation_other_TLE_acquisitions<- st_read("data/processed/manitoba/manitoba_first_nation_TLE_acquisitions_other.geojson")
mn_first_nation_non_TLE_agreements <- st_read("data/processed/manitoba/manitoba_first_nation_non_TLE_agreements.geojson")
mn_first_nation_permit_fee_simple_lands <- st_read("data/processed/manitoba/manitoba_first_nation_permit_fee_simple_lands.geojson")
mn_treaty_land_entitlement_sites <- st_read("data/processed/manitoba/manitoba_treaty_land_entitlement_sites.geojson")

indigenous_layers_with_AL_TA <- list(
  aboriginal_land_canada,
  ab_metis_settlement,
  mn_treaty_land_entitlement_sites,
  mn_first_nation_permit_fee_simple_lands,
  mn_first_nation_non_TLE_agreements,
  mn_first_nation_other_TLE_acquisitions
)

indigenous_layers_no_AL_TA <- list(
  ab_metis_settlement,
  mn_treaty_land_entitlement_sites,
  mn_first_nation_permit_fee_simple_lands,
  mn_first_nation_non_TLE_agreements,
  mn_first_nation_other_TLE_acquisitions
)




# 4:
# Protected land data

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
# or planned to be protected, which shouldn't be included. Don't use for now.
qc_projected_proteted_areas_and_critical_habitats <- st_read("data/processed/quebec/protected_areas/T_IMP_S.geojson")

# large quantities of sask (private) conservation easements not incl. in cpcad
sk_conservation_easements <- st_read("data/processed/saskatchewan/saskatchewan_conservation_easements.geojson")
# same, to a lesser extent, with crown conservation easements
sk_crown_conservation_easements <- st_read("data/processed/saskatchewan/saskatchewan_crown_conservation_easements.geojson")
# the sask proteted & conserved network shouldn't have anything beyond the above
# two sources and cpcad, but can be included
sk_protected_conserved_network <- st_read("data/processed/saskatchewan/saskatchewan_protected_conserved_network.geojson")

protected_layers_with_cpcad <- list(
  cpcad,
  NL_Provincial_Protected_Areas,
  ns_protected_areas_system,
  qc_protected_areas,
  qc_protected_zones,
  sk_conservation_easements,
  sk_crown_conservation_easements,
  sk_protected_conserved_network)
                                    
protected_layers_no_cpcad <- list(
  NL_Provincial_Protected_Areas,
  ns_protected_areas_system,
  qc_protected_areas,
  qc_protected_zones,
  sk_conservation_easements,
  sk_crown_conservation_easements,
  sk_protected_conserved_network)




# 5:
# 2020 forest based tenure raster data 

# Use for water, private land, and other tenure & protection categories.
canada_forest_management <- rast("data/processed/canada/canada_forest_management_2020/Canada_MFv2020.tif")
canada_forest_management_vat <- read.dbf("data/processed/canada/canada_forest_management_2020/Canada_MFv2020.tif.vat.dbf")
crs(canada_forest_management) # Albers Equal Area 
res(canada_forest_management) # 250m

# create lookup table for category codes
# see https://storymaps.arcgis.com/stories/52b71ae81a4e4ccba5771a42c2a32b25
unique(canada_forest_management_vat$Value)
forest_management_lookup <- c(
  water=100,
  protected=20,
  treaty=40,
  indian_reserve=32,
  federal_reserve=31,
  restricted=33,
  private=50,
  long_term_tenure=11,
  short_term_tenure=12,
  other=13
)

# 300m template grid. Use forest management raster's extent and CRS
forest_management_reproj <- project(canada_forest_management, CRS, method = "near")
template  <- rast(ext(forest_management_reproj), resolution = RESOLUTION , crs = CRS)
forest_management_reproj <- resample(forest_management_reproj, template, method = "near")
forest_management_reproj <- subst(forest_management_reproj, 0, NA) # make ocean NA instead of 0, so we can mask at the end




# 6:
# Create Version 1: Simplified

# Categories, with priority order:
#  1. Water
#  2. Protected Land 
#  3. Indigenous Land
#  4. Private Land
#  5. Other tenure & protection
#  6. Public Land 

# create raster categories
CATEGORIES_V1 <- c(
  water = 1L,
  protected = 2L,
  indigenous = 3L,
  private = 4L,
  other = 5L,
  public = 6L
)


# colors by category name 
tenure_colors <- c(
  water      = "#4575B4",
  protected  = "#2A9D5B",
  indigenous = "#D98C3F",
  private    = "#8C8C8C",
  other      = "#8E5A9E",
  public     = "#D8C58A"
)

# extract needed categories from forest management layer as separate layers.
# Resulting rasters are "binary" of cat code or NA, using terra's raster ifelse fn
water   <- ifel(forest_management_reproj == forest_management_lookup["water"],
                CATEGORIES_V1["water"],
                NA) 

private <- ifel(forest_management_reproj == forest_management_lookup["private"],
                CATEGORIES_V1["private"],
                NA) 

other   <- ifel(forest_management_reproj %in% c(forest_management_lookup["federal_reserve"], forest_management_lookup["restricted"]),
                CATEGORIES_V1["other"],
                NA)

# give public value to all cells that are not NA in the forest management raster
public <- ifel(!is.na(forest_management_reproj), CATEGORIES_V1["public"], NA)

# transform vectors 
# rasterize gives 1 when polygon covers cell, NA otherwise.
# then multiply by category code.
protected  <- rasterize_presence(protected_layers_with_cpcad, template)  * CATEGORIES_V1["protected"] 
indigenous <- rasterize_presence(indigenous_layers_with_AL_TA, template) * CATEGORIES_V1["indigenous"]

# create raster
# reduce applies cover pairwise to ensure the ordering
tenure_300m_v1 <- Reduce(terra::cover, list(
  water,
  protected,
  indigenous,
  private,
  other,
  public # catches all remaining, ie no NAs
))

# Mask the layer to exclude ocean
tenure_300m_v1 <- mask(tenure_300m_v1, forest_management_reproj)

# link up the metadata of category names 
levels(tenure_300m_v1) <- data.frame(
  value = unname(CATEGORIES_V1),
  category = tools::toTitleCase(names(CATEGORIES_V1)) # capitalised
)

# attach coloring to file
coltab(tenure_300m_v1) <- data.frame(
  value = unname(CATEGORIES_V1),
  col   = tenure_colors[names(CATEGORIES_V1)]
)

# write out as geotiff
writeRaster(tenure_300m_v1, "raster_layer/outputs/ten_layers_land_tenure_protection_v1.tif",
            overwrite = TRUE, datatype = "INT1U") # INT1U for 0-255, ie to  keep this light





# 7:
# Create Version 2 : more precise

# Categories, with priority order:
#  1. Water
#  2. Protected areas: CPCAD
#  3. Protected areas: Other
#  4. Indigenous land: Aboriginal lands of Canada Legislative Boundaries
#  5. Indigenous land: Other
#  6. Private Land
#  7. Other tenure & protection
#  8. Public Land 

CATEGORIES_V2 <- c(
  water = 1L,
  protected_cpcad  = 2L,
  protected_other = 3L,
  indigenous_legislative_boundaries = 4L,
  indigenous_other = 5L,
  private = 6L,
  other = 7L,
  public = 8L
)

tenure_colors_v2 <- c(
  water            = "#4575B4",
  protected_cpcad  = "#2A9D5B",
  protected_other  = "#8BCB8A",
  indigenous_legislative_boundaries = "#D98C3F",
  indigenous_other = "#E8B978",
  private          = "#8C8C8C",
  other            = "#8E5A9E",
  public           = "#D8C58A"
)

water   <- ifel(forest_management_reproj == forest_management_lookup["water"],
                CATEGORIES_V2["water"],
                NA) 

private <- ifel(forest_management_reproj == forest_management_lookup["private"],
                CATEGORIES_V2["private"],
                NA) 

other   <- ifel(forest_management_reproj %in% c(forest_management_lookup["federal_reserve"], forest_management_lookup["restricted"]),
                CATEGORIES_V2["other"],
                NA)

public <- ifel(!is.na(forest_management_reproj), CATEGORIES_V2["public"], NA)

protected_cpcad  <- rasterize_presence(list(cpcad), template)  * CATEGORIES_V2["protected_cpcad"] 
protected_other <- rasterize_presence(protected_layers_no_cpcad, template) * CATEGORIES_V2["protected_other"]
indigenous_legislative_boundaries <- rasterize_presence(list(aboriginal_land_canada), template) * CATEGORIES_V2["indigenous_legislative_boundaries"]
indigenous_other <- rasterize_presence(indigenous_layers_no_AL_TA, template) * CATEGORIES_V2["indigenous_other"]

tenure_300m_v2 <- Reduce(terra::cover, list(
  water,
  protected_cpcad,
  protected_other,
  indigenous_legislative_boundaries,
  indigenous_other,
  private,
  other,
  public 
))

tenure_300m_v2 <- mask(tenure_300m_v2, forest_management_reproj)

levels(tenure_300m_v2) <- data.frame(
  value = unname(CATEGORIES_V2),
  category = tools::toTitleCase(names(CATEGORIES_V2))
)

coltab(tenure_300m_v2) <- data.frame(
  value = unname(CATEGORIES_V2),
  col   = tenure_colors_v2[names(CATEGORIES_V2)]
)

writeRaster(tenure_300m_v2, "raster_layer/outputs/ten_layers_land_tenure_projection_v2.tif",
            overwrite = TRUE, datatype = "INT1U") 



plot(tenure_300m_v1)
plot(tenure_300m_v2)
