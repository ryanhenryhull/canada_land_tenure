import { PMTiles } from "pmtiles";

// Sub-layers that should render as outlines only, not filled polygons
const LINE_ONLY_LAYERS = [
  "census_subdivision_boundaries",
  // add more sourceLayer names here as needed
];

export async function getPmtilesVectorLayers(url: string) {
  try {
    const pmtiles = new PMTiles(url);
    const header = await pmtiles.getHeader();
    const metadata = await pmtiles.getMetadata();
    console.log("PMTiles metadata:", url, metadata);
    if (!metadata.vector_layers) {
      console.warn("No vector_layers found in PMTiles:", url);
      return [];
    }
    return metadata.vector_layers.map((layer: any) => ({
      id: layer.id,
      sourceLayer: layer.id,
      type: LINE_ONLY_LAYERS.includes(layer.id) ? "line" : "fill",
      color: "#3388ff"
    }));
  } catch (error) {
    console.error("Failed reading PMTiles metadata:", url, error);
    return [];
  }
}
