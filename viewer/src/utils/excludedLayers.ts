// viewer/src/utils/excludedLayers.ts

// STAC item IDs (or layer names — match whatever field stacDiscoverer uses)
// that should be hidden from the viewer entirely. Enter layers that you want to keep in the STAC but you don't want to show on the viewer.

export const EXCLUDED_LAYERS: string[] = [
  "Canada Lands",
  "federal_real_property_p",
  "BC_Parcel_Fabric_Poly"
];
