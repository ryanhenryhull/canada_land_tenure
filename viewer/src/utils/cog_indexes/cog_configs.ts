import type { CogConfig } from "./types";

import { FOREST_CONFIG } from "./forest_management";
import { TENURE_V1_CONFIG } from "./land_tenure_protection_v1";

export const COG_CONFIGS: Record<string, CogConfig> = {
  forest_management: FOREST_CONFIG,
  land_tenure_protection_v1: TENURE_V1_CONFIG
};
