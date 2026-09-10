// import them instead of defining manually each time 
import type { CogConfig, CogCategory } from "./types";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");

  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);

  return [r, g, b];
}

export const TENURE_CATEGORIES: CogCategory[] = [
   {
    value: 1,
    name: "Water",
    description: "Water",
    color: "#4575b4"
  },
  {
    value: 2,
    name: "Protected Land",
    description: "CPCAD and provincial protected/conserved area sources)",
    color: "#1a9850"
  },
  {
    value: 3,
    name: "Indigenous Land",
    description: "Aboriginal lands, Metis settlements, and other First Nation tenure/treaty land entitlement sources",
    color: "#d73027"
  },
  {
    value: 4,
    name: "Private Land",
    description: "Privately-owned lands",
    color: "#fee08b"
  },
  {
    value: 5,
    name: "Other Tenure & Protection",
    description: "Federal reserve and provincial/territorial restricted-use lands",
    color: "#984ea3"
  },
  {
    value: 6,
    name: "Public Land",
    description: "Remaining Crown land not otherwise classified",
    color: "#bdbdbd"
  } 
];

export const TENURE_COLOR_MAP: Record<number, [number, number, number]> =
  Object.fromEntries(
    TENURE_CATEGORIES.map(cat => [cat.value, hexToRgb(cat.color)])
  );



export const TENURE_V1_CONFIG: CogConfig = {
  name: "Land Tenure & Protection",
  categories: TENURE_CATEGORIES,
  colorMap: TENURE_COLOR_MAP
};
