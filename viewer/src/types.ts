export type LayerType = 'cog' | 'pmtiles' | 'geojson' | 'raster-tile';

export interface GeospatialLayer {
  id: string;
  name: string;
  type: LayerType;
  url: string;
  visible: boolean;
  opacity: number;
  description?: string;
  category?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  // COG specific settings
  cogSettings?: {
    bands: number[]; // e.g. [1, 2, 3] for RGB or [1] for single-band grayscale/colormap
    minVal: number;
    maxVal: number;
    colormapName?: string;
    activeForestIndexId?: string; // If set, calculate and display this forest index instead
    bandMapping?: {
      red: number;
      green: number;
      blue: number;
      nir: number;
      swir: number;
    };
  };
  // PMTiles/Vector specific settings
  pmtilesSettings?: {
    vectorLayers?: Array<{
      id: string;
      type: 'fill' | 'line' | 'circle' | 'symbol';
      sourceLayer: string;
      color: string;
    }>;
  };
}

export interface StacAsset {
  href: string;
  title?: string;
  description?: string;
  type?: string;
  roles?: string[];
}

export interface StacItem {
  id: string;
  type: 'Feature';
  geometry: any;
  properties: Record<string, any>;
  assets: Record<string, StacAsset>;
  links: Array<{ rel: string; href: string }>;
}

export interface StacCollection {
  id: string;
  title?: string;
  description: string;
  extent?: {
    spatial?: { bbox: number[][] };
    temporal?: { interval: string[][] };
  };
  links: Array<{ rel: string; href: string }>;
}

export interface StacCatalogNode {
  id: string;
  title?: string;
  description?: string;
  type: 'catalog' | 'collection' | 'item';
  url: string;
  childrenLinks: Array<{ rel: string; href: string; title?: string; type?: string }>;
}
