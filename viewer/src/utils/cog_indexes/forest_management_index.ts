export interface ForestCategory {
  value: number;
  name: string;
  description: string;
  color: string; // Hex color
}

export const FOREST_CATEGORIES: ForestCategory[] = [
  {
    value: 11,
    name: "Long-term Tenure",
    description: "Lands with long term volume- or area-based Crown timber dispositions",
    color: "#709c90" 
  },
  {
    value: 12,
    name: "Short-term Tenure",
    description: "Lands with short term volume- or area-based Crown timber dispositions",
    color: "#aecfb9" 
  },
  {
    value: 13,
    name: "Other",
    description: "Lands with no current Crown timber dispositions",
    color: "#ebead0" 
  },
  {
    value: 20,
    name: "Protected",
    description: "Lands legal protection status (IUCN MFIA, IB, II, III, IV, V or VI equivalent)",
    color: "#abbd38" 
  },
  {
    value: 31,
    name: "Federal Reserve",
    description: "Lands held in reserve by the Federal government for military or other purposes",
    color: "#6166c6" 
  },
  {
    value: 32,
    name: "Indian Reserve",
    description: "Lands held in reserve by the Federal government under the Indian Act",
    color: "#86510f" 
  },
  {
    value: 33,
    name: "Restricted",
    description: "Lands reserved or designated restricted use by provincial or territorial government",
    color: "#d2e14a" 
  },
  {
    value: 40,
    name: "Treaty/Settlement",
    description: "Aboriginal Lands",
    color: "#c07a08" 
  },
  {
    value: 50,
    name: "Private",
    description: "Privately-owned lands",
    color: "#46605a" 
  },
  {
    value: 100,
    name: "Water",
    description: "Water",
    color: "#ffffff" 
  }
];
