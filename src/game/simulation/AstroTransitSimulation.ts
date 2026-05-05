import { MapData, Star } from "../types/MapData";
import {
  CompanyState,
  Ship
} from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { SimulationContext } from "./context";
import { computeRouteProfile } from "./routing";
import {
  dispatchContract as executeDispatchContractInternal,
  DispatchResult
} from "./dispatch";
import {
  runCleanupPhase,
  runContractRefreshPhase,
  runDebtPhase,
  runMaintenancePhase,
  runTravelPhase
} from "./phases";
import { getStarName, pushFinancialRecord, pushLog } from "./runtime";
import { purchaseShip as purchaseShipInternal, ShipPurchaseResult } from "./shipyard";
export type { DispatchResult } from "./dispatch";
export type { ShipPurchaseResult } from "./shipyard";

export interface MaintenanceResult {
  ok: boolean;
  message: string;
  ship?: Ship;
}

export interface RelocationResult {
  ok: boolean;
  message: string;
  ship?: Ship;
}

export function createInitialCompanyState(mapData: MapData) {
  const startingStars = pickStartingStars(mapData.stars);
  const fleet: Ship[] = startingStars.map((star, index) => {
    const startingShip = GameConfig.STARTING_SHIPS[index];
    const catalogEntry = GameConfig.SHIP_CATALOG.find((shipType) => shipType.name === startingShip?.name);
    return {
      id: `ship-${index + 1}`,
      typeId: catalogEntry?.id ?? startingShip?.name.toLowerCase().replace(/\s+/g, "-"),
      name: startingShip?.name ?? `Transit-${index + 1}`,
      currentStarId: star.id,
      status: "idle",
      integrity: 100,
      capacity: startingShip?.capacity ?? 40,
      speed: startingShip?.speed ?? 360,
      maintenanceCost: startingShip?.maintenanceCost ?? 45,
      operatingCostPerDistance: startingShip?.operatingCostPerDistance ?? 0.35,
      purchasePrice: catalogEntry?.purchasePrice,
      resaleValue: catalogEntry?.resaleValue,
      equipmentSlots: catalogEntry?.equipmentSlots.map((module) => ({ ...module })) ?? [],
      flightExperience: 0
    };
  });

  const state: CompanyState = {
    currentDay: 1,
    currentTick: 0,
    credits: GameConfig.STARTING_CREDITS,
    reputation: GameConfig.STARTING_REPUTATION,
    debtDays: 0,
    diasNoVermelho: 0,
    fleet,
    availableContracts: [],
    activeContracts: [],
    completedContracts: [],
    failedContracts: [],
    regionalReputation: {},
    logs: [],
    financialRecords: [],
    arisMessages: [],
    tutorialFlags: {
      welcomed: false,
      firstDispatchCompleted: false,
      firstEventSeen: false
    },
    alerts: [],
    gameOver: false,
    fimDeJogo: false
  };

  pushLog(state, "info", "Diretoria operacional pronta. Selecione um sistema e despache uma nave para manter a Astro-Transit solvente.");

  return state;
}

export function seedInitialContracts(
  context: SimulationContext
) {
  runContractRefreshPhase(context);
}

export function advanceSimulationDay(
  context: SimulationContext
) {
  const { state } = context;
  if (state.gameOver || state.fimDeJogo) {
    return;
  }

  state.currentDay += 1;
  state.currentTick += 1;
  state.alerts = [];

  runMaintenancePhase(context);
  runTravelPhase(context);
  runDebtPhase(context);
  runContractRefreshPhase(context);
  runCleanupPhase(context);
}

export function dispatchContract(
  contractId: string,
  context: SimulationContext
): DispatchResult {
  return executeDispatchContractInternal(contractId, {
    ...context,
    pushLog,
    getStarName
  });
}

export function purchaseShip(
  shipTypeId: string,
  context: SimulationContext,
  dockStarId?: number
): ShipPurchaseResult {
  return purchaseShipInternal({
    ...context,
    pushLog,
    getStarName
  }, shipTypeId, dockStarId);
}

export function startShipMaintenance(
  shipId: string,
  context: SimulationContext
): MaintenanceResult {
  const { state } = context;
  const ship = state.fleet.find((candidate) => candidate.id === shipId);
  if (!ship) {
    return { ok: false, message: "Nave não encontrada." };
  }

  if (ship.status === "stranded" && ship.task) {
    const emergencyCost = ship.maintenanceCost * 3;
    const contractIndex = state.activeContracts.findIndex((contract) => contract.id === ship.task?.contractId);
    if (contractIndex !== -1) {
      const contract = state.activeContracts[contractIndex];
      contract.status = "failed";
      state.failedContracts.push(contract);
      state.activeContracts.splice(contractIndex, 1);
    }

    state.credits -= emergencyCost;
    pushFinancialRecord(state, "expense", emergencyCost, `Resgate emergencial de ${ship.name}`, { shipId: ship.id });
    ship.currentStarId = ship.task.originStarId;
    ship.task = undefined;
    ship.status = "maintenance";
    ship.maintenanceDaysRemaining = 2;
    pushLog(state, "warn", `${ship.name} foi rebocada para manutenção emergencial. Contrato cancelado e custo de ${emergencyCost} créditos aplicado.`);
    return {
      ok: true,
      message: `${ship.name} em manutenção emergencial.`,
      ship
    };
  }

  if (ship.task) {
    return { ok: false, message: "A nave precisa estar em porto para entrar em manutenção." };
  }

  if (ship.status !== "idle" && ship.status !== "damaged") {
    return { ok: false, message: "A nave precisa estar ociosa ou danificada para entrar em manutenção." };
  }

  if (state.credits < ship.maintenanceCost) {
    return { ok: false, message: "Créditos insuficientes para iniciar a manutenção." };
  }

  state.credits -= ship.maintenanceCost;
  pushFinancialRecord(state, "expense", ship.maintenanceCost, `Manutenção iniciada em ${ship.name}`, { shipId: ship.id });
  ship.status = "maintenance";
  ship.maintenanceDaysRemaining = 1;
  pushLog(state, "info", `${ship.name} entrou em manutenção. Custo imediato: ${ship.maintenanceCost} créditos.`);

  return {
    ok: true,
    message: `${ship.name} enviada para manutenção.`,
    ship
  };
}

export function relocateShip(
  shipId: string,
  destinationStarId: number,
  context: SimulationContext
): RelocationResult {
  const { state, navigation, regionLookup } = context;
  const ship = state.fleet.find((candidate) => candidate.id === shipId);
  if (!ship) {
    return { ok: false, message: "Nave não encontrada." };
  }

  if (ship.task) {
    return { ok: false, message: "A nave precisa estar livre para reposicionamento." };
  }

  if (ship.status !== "idle" && ship.status !== "damaged") {
    return { ok: false, message: "A nave precisa estar ociosa ou danificada para reposicionar." };
  }

  if (ship.currentStarId === destinationStarId) {
    return { ok: false, message: "A nave já está neste sistema." };
  }

  const path = navigation.findShortestPath(ship.currentStarId, destinationStarId);
  if (path.length === 0) {
    return { ok: false, message: "Rota de reposicionamento indisponível." };
  }

  const totalDistance = navigation.computePathDistance(path);
  const routeProfile = computeRouteProfile(path, regionLookup, state.regionalReputation);
  const operatingCost = Math.round(totalDistance * ship.operatingCostPerDistance * routeProfile.logisticsMultiplier * 0.55);
  if (state.credits < operatingCost) {
    return { ok: false, message: "Créditos insuficientes para reposicionar esta nave." };
  }

  state.credits -= operatingCost;
  pushFinancialRecord(state, "expense", operatingCost, `Reposicionamento de ${ship.name}`, { shipId: ship.id, regionId: routeProfile.originRegionId });

  const totalEtaDays = Math.max(1, Math.ceil(totalDistance / ship.speed));
  ship.status = "traveling";
  ship.task = {
    shipId: ship.id,
    contractId: `relocation-${ship.id}-${state.currentDay}-${state.currentTick}`,
    originStarId: ship.currentStarId,
    destinationStarId,
    path,
    totalDistance,
    remainingDistance: totalDistance,
    remainingDays: totalEtaDays,
    totalEtaDays
  };

  pushLog(state, "info", `${ship.name} iniciou reposicionamento. ETA: ${totalEtaDays} dias.`);
  return {
    ok: true,
    message: `${ship.name} reposicionando.`,
    ship
  };
}

function pickStartingStars(stars: Star[]) {
  return [...stars]
    .sort((left, right) => (Math.abs(left.x) + Math.abs(left.y)) - (Math.abs(right.x) + Math.abs(right.y)))
    .slice(0, GameConfig.STARTING_SHIPS.length);
}
