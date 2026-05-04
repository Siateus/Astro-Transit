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

  getRegionColorByRegionId(regionId: string) {
    return this.regionsById.get(regionId)?.colorHex;
  }
}
