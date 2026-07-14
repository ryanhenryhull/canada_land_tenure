import { PMTiles } from "pmtiles";

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
      type: "fill",
      color: "#3388ff"
    }));

  } catch (error) {
    console.error("Failed reading PMTiles metadata:", url, error);
    return [];
  }
}
