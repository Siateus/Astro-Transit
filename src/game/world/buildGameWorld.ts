import { buildRegions, Region } from "../models/Region";
import {
  createInitialCompanyState,
  seedInitialContracts
} from "../simulation/AstroTransitSimulation";
import { GraphNavigationLookup } from "../simulation/navigationLookup";
import { CompanyState } from "../types/AstroTransit";
import { MapData, Star } from "../types/MapData";
import { GameWorldLookup } from "./GameWorldLookup";

export interface GameWorld {
  mapData: MapData;
  navigation: GraphNavigationLookup;
  companyState: CompanyState;
  regions: Region[];
  lookup: GameWorldLookup;
}

export function buildGameWorld(rawMapData: MapData): GameWorld {
  const mapData = normalizeMapData(rawMapData);
  const starsById = buildStarsById(mapData.stars);
  const regions = buildRegions(mapData);
  const regionsById = new Map<string, Region>();
  const regionsBySystemId = new Map<number, Region>();

  regions.forEach((region) => {
    regionsById.set(region.id, region);
    region.systemIds.forEach((systemId) => {
      const star = starsById.get(systemId);
      if (!star) {
        return;
      }

      star.regionId = region.id;
      regionsBySystemId.set(systemId, region);
    });
  });

  const companyState = createInitialCompanyState(mapData);
  const lookup = new GameWorldLookup(starsById, regionsById, regionsBySystemId);
  const navigation = new GraphNavigationLookup(mapData.lanes, lookup);
  seedInitialContracts({
    state: companyState,
    stars: mapData.stars,
    starLookup: lookup,
    navigation,
    regionLookup: lookup
  });

  return {
    mapData,
    navigation,
    companyState,
    regions,
    lookup
  };
}

function normalizeMapData(rawMapData: MapData): MapData {
  return {
    ...rawMapData,
    stars: rawMapData.stars.map((star) => ({ ...star, z: star.z ?? 0 }))
  };
}

function buildStarsById(stars: Star[]) {
  const starsById = new Map<number, Star>();
  stars.forEach((star) => {
    starsById.set(star.id, star);
  });
  return starsById;
}
