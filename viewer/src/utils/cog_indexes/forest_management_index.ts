export interface ForestCategory {
  value: number;
  name: string;
  description: string;
  color: string; // Hex color
}

export const FOREST_CATEGORIES: ForestCategory[] = [
  {
    value: 11,
    name: "Federal Crown Forest",
    description: "Federal public forest land managed by federal departments (national parks, defence, etc.).",
    color: "#6366f1" // Indigo
  },
  {
    value: 12,
    name: "Provincial Crown Forest",
    description: "Provincial public forest land managed by provinces, representing the majority of commercial timber licences.",
    color: "#16a34a" // Vibrant Forest Green
  },
  {
    value: 13,
    name: "Municipal Crown Forest",
    description: "Local public forest lands managed by municipal or regional governments.",
    color: "#10b981" // Emerald
  },
  {
    value: 20,
    name: "Territorial Crown Forest",
    description: "Territorial public forest lands managed by Yukon, Northwest Territories, or Nunavut.",
    color: "#06b6d4" // Cyan
  },
  {
    value: 31,
    name: "Private - Industrial Forest",
    description: "Private forest lands owned and managed by industrial corporations or large companies.",
    color: "#ea580c" // Orange
  },
  {
    value: 32,
    name: "Private - Non-Industrial",
    description: "Private woodlots, farm woodlots, and small forest properties owned by individuals/families.",
    color: "#eab308" // Golden Yellow
  },
  {
    value: 33,
    name: "Private - Municipal / Other",
    description: "Private land owned or leased by municipalities, communities, or co-operatives.",
    color: "#fbbf24" // Amber/Gold
  },
  {
    value: 40,
    name: "Aboriginal / Indigenous Forest",
    description: "Indigenous lands, reserves, treaty areas, or lands managed directly by First Nations.",
    color: "#d946ef" // Fuchsia
  },
  {
    value: 50,
    name: "Other / Unknown Forest",
    description: "Other public forests, or lands with unresolved, unknown, or unclassified tenure profiles.",
    color: "#64748b" // Slate Grey
  },
  {
    value: 100,
    name: "Non-Forest / Water",
    description: "Water bodies, wetlands, urban areas, alpine zones, or non-forested agricultural terrain.",
    color: "#1e293b" // Deep slate/almost black
  }
];
