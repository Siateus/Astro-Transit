import {
  advanceSimulationDay,
  dispatchContract,
  DispatchResult,
  MaintenanceResult,
  startShipMaintenance
} from "../simulation/AstroTransitSimulation";
import { SimulationContext } from "../simulation/context";
import { CompanyState } from "../types/AstroTransit";
import { Star } from "../types/MapData";
import { buildOperationsHudViewModel } from "../view-models/OperationsHudViewModel";
import { buildGameWorld, GameWorld } from "../world/buildGameWorld";
import { GameWorldLookup } from "../world/GameWorldLookup";

export class GameSession {
  private readonly world: GameWorld;

  constructor(rawMapData: Parameters<typeof buildGameWorld>[0]) {
    this.world = buildGameWorld(rawMapData);
  }

  get mapData() {
    return this.world.mapData;
  }

  get companyState(): CompanyState {
    return this.world.companyState;
  }

  get stars(): Star[] {
    return this.world.mapData.stars;
  }

  get lookup(): GameWorldLookup {
    return this.world.lookup;
  }

  advanceDay() {
    advanceSimulationDay(this.createSimulationContext());
  }

  dispatchContract(contractId: string): DispatchResult {
    return dispatchContract(contractId, this.createSimulationContext());
  }

  startShipMaintenance(shipId: string): MaintenanceResult {
    return startShipMaintenance(shipId, this.createSimulationContext());
  }

  buildHudViewModel(selectedStarId: number | null) {
    const selectedStar = selectedStarId !== null
      ? this.world.lookup.getStar(selectedStarId) ?? null
      : null;
    const selectedRegion = selectedStar
      ? this.world.lookup.getRegionByStarId(selectedStar.id) ?? null
      : null;
    const contracts = selectedStar
      ? this.world.companyState.availableContracts
        .filter((contract) => contract.originStarId === selectedStar.id)
        .slice(0, 4)
      : [];

    return buildOperationsHudViewModel(
      this.world.companyState,
      selectedStar,
      selectedRegion,
      contracts,
      this.world.lookup
    );
  }

  private createSimulationContext(): SimulationContext {
    return {
      state: this.world.companyState,
      stars: this.world.mapData.stars,
      starLookup: this.world.lookup,
      navigation: this.world.navigation,
      regionLookup: this.world.lookup
    };
  }
}
