import { GeospatialLayer } from "../types";

export interface StacCatalogSample {
  name: string;
  url: string;
  description: string;
  isApi: boolean;
}

export const STAC_SAMPLES: StacCatalogSample[] = [
  {
    name: "Planet Disaster Data static catalog",
    url: "https://disaster-data.planet.com/stac/catalog.json",
    description: "Planet's high-resolution static STAC catalog of post-disaster satellite imagery.",
    isApi: false
  },
  {
    name: "Earth Search (Sentinel-2 API)",
    url: "https://earth-search.aws.element84.com/v1",
    description: "Element 84 Earth Search STAC API proxying AWS Sentinel-2 geospatial records.",
    isApi: true
  },
  {
    name: "Maxar Open Data Catalog",
    url: "https://maxar-opendata.s3.amazonaws.com/events/catalog.json",
    description: "Maxar open satellite datasets for major environmental and disaster events.",
    isApi: false
  }
];

export const SAMPLE_LAYERS: GeospatialLayer[] = [
  {
    id: "nz-port-hills",
    name: "New Zealand Christchurch Hills (PMTiles Vector)",
    type: "pmtiles",
    url: "https://r2-public.protomaps.com/protomaps-sample-datasets/nz-ports-hills.pmtiles",
    visible: true,
    opacity: 0.85,
    bounds: [172.576, -43.645, 172.766, -43.568],
    pmtilesSettings: {
      vectorLayers: [
        { id: "nz-water", type: "fill", sourceLayer: "water", color: "#38bdf8" },
        { id: "nz-roads", type: "line", sourceLayer: "roads", color: "#64748b" },
        { id: "nz-contours", type: "line", sourceLayer: "contours", color: "#b45309" },
        { id: "nz-buildings", type: "fill", sourceLayer: "buildings", color: "#f43f5e" }
      ]
    }
  },
  {
    id: "sample-cog-terrain",
    name: "California COG elevation demo (Cloud Optimized GeoTIFF)",
    type: "cog",
    url: "https://raw.githubusercontent.com/cogeotiff/cog-spec/master/spec/gdal_datasources/ca.tif",
    visible: false,
    opacity: 0.8,
    bounds: [-120.528, 38.312, -120.443, 38.384],
    cogSettings: {
      bands: [1],
      minVal: 0,
      maxVal: 2000,
      colormapName: "terrain"
    }
  },
  {
    id: "forest-management-cog",
    name: "Forest Cover & Management Classification (Categorical COG)",
    type: "cog",
    url: "https://raw.githubusercontent.com/cogeotiff/cog-spec/master/spec/gdal_datasources/ca.tif",
    visible: true,
    opacity: 0.9,
    bounds: [-120.528, 38.312, -120.443, 38.384],
    cogSettings: {
      bands: [1],
      minVal: 0,
      maxVal: 9,
      colormapName: "forest_management"
    }
  },
  {
    id: "sentinel-green-band",
    name: "Sentinel-2 NIR Band COG (Vegetation contrast)",
    type: "cog",
    url: "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/P/Y_2020_5_S2A/B08.tif",
    visible: false,
    opacity: 0.75,
    bounds: [31.5, 34.0, 32.5, 35.0],
    cogSettings: {
      bands: [1],
      minVal: 100,
      maxVal: 4000,
      colormapName: "viridis"
    }
  }
];
