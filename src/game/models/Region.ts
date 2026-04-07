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
    stats: { danger: 0.18, piracy: 0.08, tax: 0.22, security: 0.86, logistics: 0.92 }
  },
  {
    id: "rim",
    name: "Borda Livre",
    color: "#ffb15c",
    stats: { danger: 0.68, piracy: 0.62, tax: 0.07, security: 0.28, logistics: 0.48 }
  },
  {
    id: "guild",
    name: "Protetorado da Guilda",
    color: "#8cc8ff",
    stats: { danger: 0.32, piracy: 0.16, tax: 0.36, security: 0.78, logistics: 0.84 }
  },
  {
    id: "frontier",
    name: "Fronteira de Cinzas",
    color: "#ff6f7e",
    stats: { danger: 0.78, piracy: 0.44, tax: 0.04, security: 0.22, logistics: 0.34 }
  },
  {
    id: "relay",
    name: "Cintura Relay",
    color: "#d6f26b",
    stats: { danger: 0.42, piracy: 0.24, tax: 0.18, security: 0.56, logistics: 0.72 }
  },
  {
    id: "veil",
    name: "Veu Nebular",
    color: "#bd8cff",
    stats: { danger: 0.58, piracy: 0.38, tax: 0.12, security: 0.36, logistics: 0.52 }
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

  getTaxMultiplier() {
    return 1 + this.stats.tax;
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
