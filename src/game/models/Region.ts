import { MapData, RegionData, RegionStats, Star } from "../types/MapData";

interface RegionBlueprint {
  id: string;
  name: string;
  color: string;
  stats: RegionStats;
}

const REGION_BLUEPRINTS: RegionBlueprint[] = [
  {
    id: "core",
    name: "Nucleo Mercantil",
    color: "#69e6d2",
    stats: { danger: 0.12, piracy: 0.05, tax: 0.28, security: 0.9, logistics: 0.92 }
  },
  {
    id: "rim",
    name: "Borda Livre",
    color: "#ffb15c",
    stats: { danger: 0.52, piracy: 0.8, tax: 0.06, security: 0.2, logistics: 0.5 }
  },
  {
    id: "frontier",
    name: "Fronteira de Cinzas",
    color: "#ff6f7e",
    stats: { danger: 0.82, piracy: 0.42, tax: 0.04, security: 0.24, logistics: 0.25 }
  },
  {
    id: "veil",
    name: "Veu Nebular",
    color: "#bd8cff",
    stats: { danger: 0.9, piracy: 0.35, tax: 0.1, security: 0.12, logistics: 0.42 }
  }
];

export class Region {
  public readonly id: string;
  public readonly name: string;
  public readonly color: string;
  public readonly colorHex: number;
  public readonly systemIds: number[];
  public readonly capitalSystemId?: number;
  public readonly stats: RegionStats;
  public readonly systems: Star[];

  constructor(data: RegionData, systems: Star[]) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.colorHex = Region.toColorHex(data.color);
    this.systemIds = data.systemIds;
    this.capitalSystemId = data.capitalSystemId;
    this.stats = data.stats;
    this.systems = systems;
  }

  hasSystem(systemId: number) {
    return this.systemIds.includes(systemId);
  }

  getRiskModifier() {
    return (this.stats.danger * 0.45) + (this.stats.piracy * 0.4) - (this.stats.security * 0.18);
  }

  getTaxMultiplier(reputation = 50) {
    const reputationDiscount = Math.max(-0.18, Math.min(0.18, (reputation - 50) / 280));
    return Math.max(1, 1 + this.stats.tax - reputationDiscount);
  }

  getLogisticsMultiplier() {
    return 1 + ((1 - this.stats.logistics) * 0.35);
  }

  private static toColorHex(color: string) {
    return Number.parseInt(color.replace("#", ""), 16);
  }
}

export function buildRegions(mapData: MapData) {
  const regionData = mapData.regions && mapData.regions.length > 0
    ? mapData.regions
    : buildFallbackRegions(mapData.stars);

  return regionData.map((region) => new Region(
    region,
    mapData.stars.filter((star) => region.systemIds.includes(star.id))
  ));
}

function buildFallbackRegions(stars: Star[]) {
  const buckets = new Map<string, number[]>();
  REGION_BLUEPRINTS.forEach((blueprint) => buckets.set(blueprint.id, []));

  stars.forEach((star) => {
    const angle = Math.atan2(star.y, star.x);
    const normalizedAngle = angle < 0 ? angle + (Math.PI * 2) : angle;
    const index = Math.floor((normalizedAngle / (Math.PI * 2)) * REGION_BLUEPRINTS.length) % REGION_BLUEPRINTS.length;
    buckets.get(REGION_BLUEPRINTS[index].id)!.push(star.id);
  });

  return REGION_BLUEPRINTS.map((blueprint) => {
    const systemIds = buckets.get(blueprint.id) ?? [];
    return {
      ...blueprint,
      systemIds,
      capitalSystemId: pickCapitalSystemId(stars, systemIds)
    };
  });
}

function pickCapitalSystemId(stars: Star[], systemIds: number[]) {
  const systems = stars.filter((star) => systemIds.includes(star.id));
  return systems
    .sort((left, right) => (Math.abs(left.x) + Math.abs(left.y)) - (Math.abs(right.x) + Math.abs(right.y)))[0]?.id;
}
