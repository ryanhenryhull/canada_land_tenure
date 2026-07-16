import { FOREST_CATEGORIES } from "./forest_management_index";

// Convert hex string to RGB array
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b];
}

// Built-in map of category value to RGB colors
export const FOREST_COLOR_MAP: Record<number, [number, number, number]> = {};

FOREST_CATEGORIES.forEach(cat => {
  FOREST_COLOR_MAP[cat.value] = hexToRgb(cat.color);
});

/**
 * Retrieves the RGB color for a given categorical forest management pixel value.
 * Rounds to nearest integer value to handle any potential interpolations.
 */
export function getForestColor(value: number): [number, number, number] {
  const rounded = Math.round(value);
  return FOREST_COLOR_MAP[rounded] || [71, 85, 105]; // Default to slate-600 [71, 85, 105] for unknown values
}
