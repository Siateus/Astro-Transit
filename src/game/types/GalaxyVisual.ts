import { Star } from "./MapData";

export interface MockEmpire {
  id: string;
  name: string;
  color: number;
  systemIds: number[];
  capitalSystemId: number;
  emblemKey?: string;
}

export interface ProjectedStar {
  id: number;
  star: Star;
  name: string;
  screenX: number;
  screenY: number;
  alpha: number;
  radius: number;
  importance: number;
  isCapital: boolean;
  regionId?: string;
}

export interface LabelVisibilityRule {
  minZoom: number;
  maxLabels: number;
  capitalsOnly?: boolean;
}

export interface GalaxyVisualConfig {
  backgroundStarCount: number;
  galaxyCloudCount: number;
  dustCloudCount: number;
  territoryPadding: number;
  territoryAlpha: number;
  laneAlpha: number;
  laneWidth: number;
  glowStrength: number;
  labelRules: LabelVisibilityRule[];
}
