import Phaser from "phaser";
import {
  advanceSimulationDay,
  dispatchContract,
  DispatchResult,
  MaintenanceResult,
  purchaseShip,
  RelocationResult,
  relocateShip,
  ShipPurchaseResult,
  startShipMaintenance
} from "../simulation/AstroTransitSimulation";
import { SimulationContext } from "../simulation/context";
import { CompanyState } from "../types/AstroTransit";
import { Star } from "../types/MapData";
import { buildOperationsHudViewModel, ContractFilterMode } from "../view-models/OperationsHudViewModel";
import { buildGameWorld, GameWorld } from "../world/buildGameWorld";
import { GameWorldLookup } from "../world/GameWorldLookup";
import { PersistenceManager } from "../simulation/persistence";
import { computeRouteProfile } from "../simulation/routing";

export interface RoutePreview {
  contractId: string;
  path: number[];
  risk: number;
  damageProbability: number;
}

export class GameSession {
  private readonly world: GameWorld;
  private contractFilter: ContractFilterMode = "profit";

  constructor(rawMapData: Parameters<typeof buildGameWorld>[0], mode: "new" | "continue" = "new") {
    const savedState = mode === "continue" ? PersistenceManager.loadState() ?? undefined : undefined;
    if (mode === "new") {
      PersistenceManager.clearSave();
    }

    this.world = buildGameWorld(rawMapData, savedState);
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
    PersistenceManager.saveState(this.world.companyState);
  }

  dispatchContract(contractId: string): DispatchResult {
    const result = dispatchContract(contractId, this.createSimulationContext());
    if (result.ok) {
      PersistenceManager.saveState(this.world.companyState);
    }
    return result;
  }

  startShipMaintenance(shipId: string): MaintenanceResult {
    const result = startShipMaintenance(shipId, this.createSimulationContext());
    if (result.ok) {
      PersistenceManager.saveState(this.world.companyState);
    }
    return result;
  }

  relocateShip(shipId: string, destinationStarId: number): RelocationResult {
    const result = relocateShip(shipId, destinationStarId, this.createSimulationContext());
    if (result.ok) {
      PersistenceManager.saveState(this.world.companyState);
    }
    return result;
  }

  purchaseShip(shipTypeId: string, dockStarId?: number): ShipPurchaseResult {
    const result = purchaseShip(shipTypeId, this.createSimulationContext(), dockStarId);
    if (result.ok) {
      PersistenceManager.saveState(this.world.companyState);
    }
    return result;
  }

  cycleContractFilter() {
    const modes: ContractFilterMode[] = ["profit", "distance", "risk"];
    const currentIndex = modes.indexOf(this.contractFilter);
    this.contractFilter = modes[(currentIndex + 1) % modes.length];
  }

  save() {
    PersistenceManager.saveState(this.world.companyState);
  }

  getRoutePreview(contractId: string): RoutePreview | null {
    const contract = this.world.companyState.availableContracts.find((candidate) => candidate.id === contractId);
    if (!contract) {
      return null;
    }

    const path = this.world.navigation.findShortestPath(contract.originStarId, contract.destinationStarId);
    if (path.length === 0) {
      return null;
    }

    const routeProfile = computeRouteProfile(path, this.world.lookup, this.world.companyState.regionalReputation);
    const risk = Math.max(0, routeProfile.averageRiskScore);
    return {
      contractId,
      path,
      risk,
      damageProbability: Math.round(Phaser.Math.Clamp(risk * 100, 3, 85))
    };
  }

  buildHudViewModel(selectedStarId: number | null) {
    const selectedStar = selectedStarId !== null
      ? this.world.lookup.getStar(selectedStarId) ?? null
      : null;
    const selectedRegion = selectedStar
      ? this.world.lookup.getRegionByStarId(selectedStar.id) ?? null
      : null;
    const contracts = selectedStar
      ? [...this.world.companyState.availableContracts]
        .filter((contract) => contract.originStarId === selectedStar.id)
        .sort((left, right) => sortContracts(left, right, this.contractFilter))
        .slice(0, 4)
      : [];

    return buildOperationsHudViewModel(
      this.world.companyState,
      selectedStar,
      selectedRegion,
      contracts,
      this.world.lookup,
      this.contractFilter
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

function sortContracts(
  left: CompanyState["availableContracts"][number],
  right: CompanyState["availableContracts"][number],
  filter: ContractFilterMode
) {
  if (filter === "risk") {
    return (left.routeRisk ?? left.risk) - (right.routeRisk ?? right.risk);
  }

  if (filter === "distance") {
    return left.etaDays - right.etaDays;
  }

  const leftProfit = left.reward - left.penalty - (left.routeTax ?? 0);
  const rightProfit = right.reward - right.penalty - (right.routeTax ?? 0);
  return rightProfit - leftProfit;
}
