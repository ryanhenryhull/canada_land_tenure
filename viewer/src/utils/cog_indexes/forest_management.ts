export interface ForestIndex {
  id: string;
  name: string;
  formula: string;
  description: string;
  requiredBands: string[];
  defaultMin: number;
  defaultMax: number;
}

export const FOREST_INDEXES: ForestIndex[] = [
  {
    id: "ndvi",
    name: "NDVI (Vegetation Density)",
    formula: "(NIR - Red) / (NIR + Red)",
    description: "Normalized Difference Vegetation Index. Highly sensitive to green forest canopies and active chlorophyll absorption.",
    requiredBands: ["NIR", "Red"],
    defaultMin: 0.0,
    defaultMax: 0.8,
  },
  {
    id: "ndwi",
    name: "NDWI (Canopy Moisture)",
    formula: "(NIR - SWIR) / (NIR + SWIR)",
    description: "Normalized Difference Water Index. Excellent for measuring liquid water content and canopy moisture stress in forests.",
    requiredBands: ["NIR", "SWIR"],
    defaultMin: -0.2,
    defaultMax: 0.6,
  },
  {
    id: "evi",
    name: "EVI (Enhanced Vegetation)",
    formula: "2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))",
    description: "Enhanced Vegetation Index. Provides better sensitivity in high-biomass, dense forest regions with atmospheric correction.",
    requiredBands: ["NIR", "Red", "Blue"],
    defaultMin: 0.1,
    defaultMax: 0.9,
  },
  {
    id: "nbr",
    name: "NBR (Burn Severity)",
    formula: "(NIR - SWIR) / (NIR + SWIR)",
    description: "Normalized Burn Ratio. Used extensively in forestry to delineate fire burn scars and monitor vegetative regeneration.",
    requiredBands: ["NIR", "SWIR"],
    defaultMin: -0.3,
    defaultMax: 0.5,
  }
];

// Helper to compute a specific index pixel-by-pixel
export function computeIndexValue(
  indexId: string,
  pixelIdx: number,
  getBandVal: (bandNum: number) => number,
  mapping: { red: number; green: number; blue: number; nir: number; swir: number }
): number {
  const r = getBandVal(mapping.red);
  const g = getBandVal(mapping.green);
  const b = getBandVal(mapping.blue);
  const nir = getBandVal(mapping.nir);
  const swir = getBandVal(mapping.swir);

  switch (indexId) {
    case "ndvi": {
      const denom = nir + r;
      return denom === 0 ? 0 : (nir - r) / denom;
    }
    case "ndwi": {
      const denom = nir + swir;
      return denom === 0 ? 0 : (nir - swir) / denom;
    }
    case "evi": {
      const denom = nir + 6 * r - 7.5 * b + 1;
      return denom === 0 ? 0 : 2.5 * ((nir - r) / denom);
    }
    case "nbr": {
      const denom = nir + swir;
      return denom === 0 ? 0 : (nir - swir) / denom;
    }
    default:
      return r; // Default fallback to Red band
  }
}
