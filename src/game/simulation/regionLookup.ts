import { Region } from "../models/Region";

export interface RegionLookup {
  getRegionByStarId(starId: number): Region | undefined;
}

export class MapRegionLookup implements RegionLookup {
  constructor(private readonly regionsBySystemId: Map<number, Region>) {}

  getRegionByStarId(starId: number) {
    return this.regionsBySystemId.get(starId);
  }
}
