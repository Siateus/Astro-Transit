import { MapData, Star } from "../types/MapData";
import {
  CompanyState,
  Ship
} from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { SimulationContext } from "./context";
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
import { getStarName, pushArisMessage, pushLog } from "./runtime";
export type { DispatchResult } from "./dispatch";

export interface MaintenanceResult {
  ok: boolean;
  message: string;
  ship?: Ship;
}

export function createInitialCompanyState(mapData: MapData) {
  const startingStars = pickStartingStars(mapData.stars);
  const fleet: Ship[] = startingStars.map((star, index) => ({
    id: `ship-${index + 1}`,
    name: GameConfig.STARTING_SHIPS[index]?.name ?? `Transit-${index + 1}`,
    currentStarId: star.id,
    status: "idle",
    integrity: 100,
    capacity: GameConfig.STARTING_SHIPS[index]?.capacity ?? 40,
    speed: GameConfig.STARTING_SHIPS[index]?.speed ?? 360,
    maintenanceCost: GameConfig.STARTING_SHIPS[index]?.maintenanceCost ?? 45,
    operatingCostPerDistance: GameConfig.STARTING_SHIPS[index]?.operatingCostPerDistance ?? 0.35
  }));

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
    logs: [],
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

  pushArisMessage(state, "tutorial", "A.R.I.S. online. Nossa sobrevivência depende de entregas estáveis pelas starlanes.");
  pushLog(state, "aris", "A.R.I.S.: Selecione um sistema e despache uma nave para manter a Astro-Transit solvente.");

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

export function startShipMaintenance(
  shipId: string,
  context: SimulationContext
): MaintenanceResult {
  const { state } = context;
  const ship = state.fleet.find((candidate) => candidate.id === shipId);
  if (!ship) {
    return { ok: false, message: "Nave não encontrada." };
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
  ship.status = "maintenance";
  ship.maintenanceDaysRemaining = 1;
  pushLog(state, "info", `${ship.name} entrou em manutenção. Custo imediato: ${ship.maintenanceCost} créditos.`);

  return {
    ok: true,
    message: `${ship.name} enviada para manutenção.`,
    ship
  };
}

function pickStartingStars(stars: Star[]) {
  return [...stars]
    .sort((left, right) => (Math.abs(left.x) + Math.abs(left.y)) - (Math.abs(right.x) + Math.abs(right.y)))
    .slice(0, GameConfig.STARTING_SHIPS.length);
}
