import type { CogConfig } from "./types";

import { FOREST_CONFIG } from "./forest_management";
import { TENURE_V1_CONFIG } from "./land_tenure_protection_v1";

export const COG_CONFIGS: Record<string, CogConfig> = {
  forest_management: FOREST_CONFIG,
  land_tenure_protection_v1: TENURE_V1_CONFIG
};

export function getCategoryColor(cogConfigId: string | undefined, value: number): [number, number, number] {
  if (!cogConfigId) return [71, 85, 105]; // slate-600 fallback, matches existing default
  const config = COG_CONFIGS[cogConfigId];
  if (!config) return [71, 85, 105];
  return config.colorMap[Math.round(value)] || [71, 85, 105];
}
