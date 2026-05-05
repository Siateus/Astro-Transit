import Phaser from "phaser";
import { Region } from "../models/Region";
import { RegionLookup } from "../simulation/regionLookup";
import { StarLookup } from "../simulation/starLookup";
import { Star } from "../types/MapData";

export class GameWorldLookup implements RegionLookup, StarLookup {
  constructor(
    private readonly starsById: Map<number, Star>,
    private readonly regionsById: Map<string, Region>,
    private readonly regionsBySystemId: Map<number, Region>
  ) {}

  getStar(starId: number) {
    return this.starsById.get(starId);
  }

  getRegionById(regionId: string) {
    return this.regionsById.get(regionId);
  }

  getRegionByStarId(starId: number) {
    return this.regionsBySystemId.get(starId);
  }

  getRegionAtRouteProgress(path: number[], traveledDistance: number, _starLookup?: StarLookup) {
    if (path.length === 0) {
      return undefined;
    }

    let coveredDistance = 0;
    for (let index = 1; index < path.length; index += 1) {
      const from = this.getStar(path[index - 1]);
      const to = this.getStar(path[index]);
      if (!from || !to) {
        continue;
      }

      const segmentDistance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      if (traveledDistance <= coveredDistance + segmentDistance) {
        return this.getRegionByStarId(path[index - 1]) ?? this.getRegionByStarId(path[index]);
      }

      coveredDistance += segmentDistance;
    }

    return this.getRegionByStarId(path[path.length - 1]);
  }

  getRegionColorByRegionId(regionId: string) {
    return this.regionsById.get(regionId)?.colorHex;
  }

  getRegionRiskColorByRegionId(regionId: string) {
    const region = this.regionsById.get(regionId);
    if (!region) {
      return undefined;
    }

    return riskToColor(region.getRiskModifier());
  }

  getRegionRiskByRegionId(regionId: string) {
    return this.regionsById.get(regionId)?.getRiskModifier();
  }
}

function riskToColor(riskScore: number) {
  if (riskScore < 0.08) {
    return 0x7fd7c4;
  }

  if (riskScore < 0.22) {
    return 0xf2c96b;
  }

  if (riskScore < 0.38) {
    return 0xff8a55;
  }

  return 0xff4b5f;
}
