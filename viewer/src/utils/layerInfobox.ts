// viewer/src/utils/layerInfobox.ts
import infoboxData from "../layer_infobox_data.json";

export interface LayerInfobox {
  citation: string;
  description: string;
  download_link: string;
}

// Flatten the nested location/layers JSON into a single lookup keyed by layer_name
const infoboxLookup: Record<string, LayerInfobox> = {};

infoboxData.forEach((location: any) => {
  location.layers.forEach((layer: any) => {
    infoboxLookup[layer.layer_name] = {
      citation: layer.citation,
      description: layer.description,
      download_link: layer.download_link
    };
  });
});

export function getLayerInfobox(layerName: string): LayerInfobox | undefined {
  return infoboxLookup[layerName];
}
