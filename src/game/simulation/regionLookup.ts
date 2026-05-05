import Phaser from "phaser";
import { Region } from "../models/Region";
import { StarLookup } from "./starLookup";

export interface RegionLookup {
  getRegionByStarId(starId: number): Region | undefined;
  getRegionAtRouteProgress?(path: number[], traveledDistance: number, starLookup: StarLookup): Region | undefined;
}

export class MapRegionLookup implements RegionLookup {
  constructor(private readonly regionsBySystemId: Map<number, Region>) {}

  getRegionByStarId(starId: number) {
    return this.regionsBySystemId.get(starId);
  }

  getRegionAtRouteProgress(path: number[], traveledDistance: number, starLookup: StarLookup) {
    if (path.length === 0) {
      return undefined;
    }

    let coveredDistance = 0;
    for (let index = 1; index < path.length; index += 1) {
      const from = starLookup.getStar(path[index - 1]);
      const to = starLookup.getStar(path[index]);
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
}
