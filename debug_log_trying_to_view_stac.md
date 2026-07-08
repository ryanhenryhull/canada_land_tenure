# gdalinfo https://pub-5ac3c27e0001486290fb4f649e61b4a8.r2.dev/Canada_MFv2020.tif
This reveals that the COG does indeed successfully load from the R2.
However, the COG is huge, too large for stac-map to render client-side.
Using deck.gl raster could help do this rendering of GB-sized COGs on the browser, no server. try this now. 
