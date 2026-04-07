export interface Star {
  id: number;
  x: number;
  y: number;
  z?: number;
  color: string;
  name?: string;
  regionId?: string;
}

export interface Lane {
  from: number;
  to: number;
}

export interface RegionStats {
  danger: number;
  piracy: number;
  tax: number;
  security: number;
  logistics: number;
}

export interface RegionData {
  id: string;
  name: string;
  color: string;
  systemIds: number[];
  capitalSystemId?: number;
  stats: RegionStats;
}

export interface MapData {
  stars: Star[];
  lanes: Lane[];
  regions?: RegionData[];
}
