import type { CogConfig, CogCategory } from "./types";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");

  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);

  return [r, g, b];
}

export const FOREST_CATEGORIES: CogCategory[] = [
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
    color: "#aadaff"
  }
];

export const FOREST_COLOR_MAP: Record<number, [number, number, number]> =
  Object.fromEntries(
    FOREST_CATEGORIES.map(cat => [cat.value, hexToRgb(cat.color)])
  );

export const FOREST_CONFIG: CogConfig = {
  name: "Forest Management in Canada, 2020",
  categories: FOREST_CATEGORIES,
  colorMap: FOREST_COLOR_MAP
};
