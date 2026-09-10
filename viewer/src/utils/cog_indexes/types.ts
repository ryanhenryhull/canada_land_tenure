export interface CogCategory {
  value: number;
  name: string;
  description: string;
  color: string;
}

export interface CogConfig {
  categories: CogCategory[];
  colorMap: Record<number, [number, number, number]>;
}
