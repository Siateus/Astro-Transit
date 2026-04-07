import Phaser from "phaser";
import { Lane, MapData, Star } from "../types/MapData";
import { Region } from "../models/Region";
import {
  ArisMessage,
  CompanyState,
  Contract,
  EventType,
  GameEvent,
  LogEntry,
  Ship,
  TravelTask
} from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";

export type StarGraph = Map<number, number[]>;

export interface DispatchResult {
  ok: boolean;
  message: string;
  contract?: Contract;
  ship?: Ship;
}

export function buildStarGraph(lanes: Lane[]) {
  const graph: StarGraph = new Map();

  lanes.forEach((lane) => {
    if (!graph.has(lane.from)) {
      graph.set(lane.from, []);
    }
    if (!graph.has(lane.to)) {
      graph.set(lane.to, []);
    }
    graph.get(lane.from)!.push(lane.to);
    graph.get(lane.to)!.push(lane.from);
  });

  return graph;
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
    gameOver: false
  };

  pushArisMessage(state, "tutorial", "A.R.I.S. online. Nossa sobrevivência depende de entregas estáveis pelas starlanes.");
  pushLog(state, "aris", "A.R.I.S.: Selecione um sistema e despache uma nave para manter a Astro-Transit solvente.");

  return state;
}

export function seedInitialContracts(
  state: CompanyState,
  mapData: MapData,
  graph: StarGraph,
  regionsBySystemId?: Map<number, Region>
) {
  refillContracts(state, mapData.stars, graph, regionsBySystemId);
}

export function refillContracts(
  state: CompanyState,
  stars: Star[],
  graph: StarGraph,
  regionsBySystemId?: Map<number, Region>
) {
  const rng = new Phaser.Math.RandomDataGenerator([`contracts-${state.currentDay}-${state.currentTick}`]);
  const desiredContracts = GameConfig.MAX_AVAILABLE_CONTRACTS;
  const idleOrigins = [...new Set(state.fleet.map((ship) => ship.currentStarId))];

  while (state.availableContracts.length < desiredContracts) {
    const originStarId = rng.pick(idleOrigins);
    const destinationStar = rng.pick(stars.filter((star) => star.id !== originStarId));
    const path = findShortestPath(graph, originStarId, destinationStar.id);
    if (path.length === 0) {
      continue;
    }

    const totalDistance = computePathDistance(path, stars);
    const routeProfile = computeRouteProfile(path, regionsBySystemId);
    const etaDays = Math.max(1, Math.ceil(totalDistance / GameConfig.CONTRACT_REFERENCE_SPEED));
    const cargoUnits = rng.between(10, 40);
    const risk = Phaser.Math.Clamp(
      (path.length - 1) * 0.08 + rng.realInRange(0.04, 0.18) + routeProfile.riskModifier,
      0.08,
      0.82
    );
    const routeTax = Math.round((totalDistance * GameConfig.CONTRACT_TAX_PER_DISTANCE) * routeProfile.taxMultiplier);
    const logisticsBonus = Math.round(cargoUnits * GameConfig.CONTRACT_LOGISTICS_BONUS_PER_CARGO * routeProfile.logisticsMultiplier);

    state.availableContracts.push({
      id: `contract-${state.currentDay}-${state.availableContracts.length}-${destinationStar.id}`,
      title: `Entrega para ${destinationStar.name ?? `Sistema ${destinationStar.id}`}`,
      originStarId,
      destinationStarId: destinationStar.id,
      cargoUnits,
      reward: Math.round(
        (totalDistance * GameConfig.CONTRACT_REWARD_PER_DISTANCE)
        + (cargoUnits * GameConfig.CONTRACT_REWARD_PER_CARGO)
        + logisticsBonus
        - routeTax
      ),
      penalty: Math.round((totalDistance * GameConfig.CONTRACT_PENALTY_PER_DISTANCE) + 120 + routeTax),
      risk,
      deadlineDay: state.currentDay + etaDays + rng.between(2, 5),
      status: "available",
      etaDays,
      originRegionId: routeProfile.originRegionId,
      destinationRegionId: routeProfile.destinationRegionId,
      routeTax
    });
  }
}

export function dispatchContract(
  state: CompanyState,
  contractId: string,
  stars: Star[],
  graph: StarGraph,
  regionsBySystemId?: Map<number, Region>
): DispatchResult {
  const contractIndex = state.availableContracts.findIndex((contract) => contract.id === contractId);
  if (contractIndex === -1) {
    return { ok: false, message: "Contrato não encontrado." };
  }

  const contract = state.availableContracts[contractIndex];
  const ship = state.fleet.find((candidate) => candidate.status === "idle" && candidate.currentStarId === contract.originStarId);
  if (!ship) {
    return {
      ok: false,
      message: "Nenhuma nave ociosa neste sistema. Leve uma nave para cá ou escolha outro contrato."
    };
  }

  const path = findShortestPath(graph, contract.originStarId, contract.destinationStarId);
  if (path.length === 0) {
    return { ok: false, message: "Rota indisponível pelas starlanes." };
  }

  const totalDistance = computePathDistance(path, stars);
  const routeProfile = computeRouteProfile(path, regionsBySystemId);
  const operatingCost = Math.round(totalDistance * ship.operatingCostPerDistance * routeProfile.logisticsMultiplier);
  if (state.credits < operatingCost) {
    return { ok: false, message: "Créditos insuficientes para cobrir os custos operacionais desta viagem." };
  }

  state.credits -= operatingCost;

  const totalEtaDays = Math.max(1, Math.ceil(totalDistance / ship.speed));
  const task: TravelTask = {
    shipId: ship.id,
    contractId: contract.id,
    originStarId: contract.originStarId,
    destinationStarId: contract.destinationStarId,
    path,
    totalDistance,
    remainingDays: totalEtaDays,
    totalEtaDays
  };

  ship.status = "traveling";
  ship.task = task;

  contract.status = "active";
  contract.assignedShipId = ship.id;
  state.activeContracts.push(contract);
  state.availableContracts.splice(contractIndex, 1);

  pushLog(
    state,
    "info",
    `${ship.name} partiu de ${getStarName(stars, contract.originStarId)} rumo a ${getStarName(stars, contract.destinationStarId)}. ETA: ${totalEtaDays} dias.`
  );

  return {
    ok: true,
    message: `${ship.name} despachada com sucesso.`,
    contract,
    ship
  };
}

export function advanceSimulationDay(
  state: CompanyState,
  stars: Star[],
  graph: StarGraph,
  regionsBySystemId?: Map<number, Region>
) {
  if (state.gameOver) {
    return;
  }

  state.currentDay += 1;
  state.currentTick += 1;
  state.alerts = [];

  applyMaintenanceCosts(state);
  resolveTravel(state, stars, regionsBySystemId);
  resolveDebt(state);
  expireContracts(state, stars);
  refillContracts(state, stars, graph, regionsBySystemId);
  trimCollections(state);
}

function applyMaintenanceCosts(state: CompanyState) {
  const maintenance = state.fleet.reduce((total, ship) => total + ship.maintenanceCost, 0);
  state.credits -= maintenance;
  pushLog(state, "info", `Custos de manutenção do dia: ${maintenance} créditos.`);
}

function resolveTravel(state: CompanyState, stars: Star[], regionsBySystemId?: Map<number, Region>) {
  state.fleet.forEach((ship) => {
    if (!ship.task) {
      return;
    }

    ship.task.remainingDays -= 1;
    maybeTriggerTravelEvent(state, ship, stars, regionsBySystemId);

    if (ship.task.remainingDays > 0 || ship.status === "stranded") {
      return;
    }

    const task = ship.task;
    const contractIndex = state.activeContracts.findIndex((contract) => contract.id === task.contractId);
    if (contractIndex === -1) {
      ship.task = undefined;
      ship.status = "idle";
      return;
    }

    const contract = state.activeContracts[contractIndex];
    ship.currentStarId = task.destinationStarId;
    ship.task = undefined;
    ship.status = ship.integrity < 45 ? "damaged" : "idle";

    const delayDays = Math.max(state.currentDay - contract.deadlineDay, 0);
    const successBonus = ship.integrity > 80 ? GameConfig.EVENTS.SAFE_ARRIVAL_BONUS : 0;
    const payout = delayDays > 0
      ? Math.max(0, contract.reward - (delayDays * GameConfig.LATE_DELIVERY_PENALTY_PER_DAY))
      : contract.reward + successBonus;

    state.credits += payout;
    state.reputation += delayDays > 0 ? -2 : 3;

    contract.status = delayDays > 0 ? "failed" : "completed";
    state.activeContracts.splice(contractIndex, 1);
    if (contract.status === "completed") {
      state.completedContracts.push(contract);
    } else {
      state.failedContracts.push(contract);
    }

    pushLog(
      state,
      contract.status === "completed" ? "success" : "warn",
      `${ship.name} chegou a ${getStarName(stars, task.destinationStarId)}. Resultado financeiro: ${payout} créditos.`
    );

    if (!state.tutorialFlags.firstDispatchCompleted) {
      state.tutorialFlags.firstDispatchCompleted = true;
      pushArisMessage(state, "status", "Primeira entrega concluída. Agora precisamos equilibrar risco, manutenção e reputação.");
    }
  });
}

function maybeTriggerTravelEvent(
  state: CompanyState,
  ship: Ship,
  stars: Star[],
  regionsBySystemId?: Map<number, Region>
) {
  if (!ship.task) {
    return;
  }

  const contract = state.activeContracts.find((candidate) => candidate.id === ship.task?.contractId);
  if (!contract) {
    return;
  }

  const rng = new Phaser.Math.RandomDataGenerator([`${state.currentDay}-${ship.id}-${contract.id}`]);
  const roll = rng.frac();
  const routeProfile = computeRouteProfile(ship.task.path, regionsBySystemId);
  const threshold = Phaser.Math.Clamp(
    contract.risk * GameConfig.TRAVEL_EVENT_FACTOR * routeProfile.eventMultiplier,
    0.02,
    0.72
  );
  if (roll >= threshold) {
    return;
  }

  const eventType = pickRouteEventType(rng, routeProfile);
  const event = createEvent(eventType, state.currentDay, ship, contract, stars, rng, routeProfile);
  applyEvent(state, ship, contract, event);
}

function createEvent(
  type: EventType,
  day: number,
  ship: Ship,
  contract: Contract,
  stars: Star[],
  rng: Phaser.Math.RandomDataGenerator,
  routeProfile: RouteProfile
): GameEvent {
  if (type === "pirates") {
    return {
      id: `${type}-${ship.id}-${day}`,
      day,
      type,
      severity: Math.round(rng.between(10, 24) * routeProfile.piracyMultiplier),
      description: `Piratas emboscaram ${ship.name} perto de ${getStarName(stars, ship.task?.destinationStarId ?? contract.destinationStarId)}.`
    };
  }

  if (type === "warp_failure") {
    return {
      id: `${type}-${ship.id}-${day}`,
      day,
      type,
      severity: rng.between(1, 2),
      description: `O warp drive de ${ship.name} apresentou falha crítica.`
    };
  }

  return {
    id: `${type}-${ship.id}-${day}`,
    day,
    type,
    severity: rng.between(80, 180),
    description: `Crise logística elevou custos de suporte para ${ship.name}.`
  };
}

interface RouteProfile {
  originRegionId?: string;
  destinationRegionId?: string;
  riskModifier: number;
  taxMultiplier: number;
  logisticsMultiplier: number;
  piracyMultiplier: number;
  eventMultiplier: number;
}

function computeRouteProfile(path: number[], regionsBySystemId?: Map<number, Region>): RouteProfile {
  const regions = path
    .map((systemId) => regionsBySystemId?.get(systemId))
    .filter((region): region is Region => Boolean(region));

  if (regions.length === 0) {
    return {
      riskModifier: 0,
      taxMultiplier: 1,
      logisticsMultiplier: 1,
      piracyMultiplier: 1,
      eventMultiplier: 1
    };
  }

  const averageDanger = average(regions.map((region) => region.stats.danger));
  const averagePiracy = average(regions.map((region) => region.stats.piracy));
  const averageSecurity = average(regions.map((region) => region.stats.security));
  const averageTax = average(regions.map((region) => region.stats.tax));
  const averageLogistics = average(regions.map((region) => region.stats.logistics));

  return {
    originRegionId: regions[0]?.id,
    destinationRegionId: regions[regions.length - 1]?.id,
    riskModifier: Phaser.Math.Clamp((averageDanger * 0.32) + (averagePiracy * 0.28) - (averageSecurity * 0.18), -0.12, 0.36),
    taxMultiplier: 1 + averageTax,
    logisticsMultiplier: 1 + ((1 - averageLogistics) * 0.35),
    piracyMultiplier: 1 + averagePiracy,
    eventMultiplier: Phaser.Math.Clamp(1 + averageDanger + (averagePiracy * 0.5) - averageSecurity, 0.55, 1.85)
  };
}

function pickRouteEventType(rng: Phaser.Math.RandomDataGenerator, routeProfile: RouteProfile) {
  const pirateWeight = routeProfile.piracyMultiplier > 1.4 ? 4 : 2;
  const weightedEvents: EventType[] = [
    ...Array(pirateWeight).fill("pirates"),
    "warp_failure",
    "logistics_crisis"
  ];
  return rng.pick(weightedEvents);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function applyEvent(state: CompanyState, ship: Ship, contract: Contract, event: GameEvent) {
  if (!ship.task) {
    return;
  }

  if (!state.tutorialFlags.firstEventSeen) {
    state.tutorialFlags.firstEventSeen = true;
    pushArisMessage(state, "alert", "Eventos de rota alteram lucro, prazo e integridade. Adapte sua operação rapidamente.");
  }

  if (event.type === "pirates") {
    ship.integrity = Math.max(10, ship.integrity - event.severity);
    ship.task.remainingDays += 1;
    state.credits -= GameConfig.PIRATE_ATTACK_COST;
    state.alerts.push(`Ataque pirata em ${ship.name}`);
    pushLog(state, "warn", `${event.description} Integridade reduzida para ${ship.integrity}%.`);
    return;
  }

  if (event.type === "warp_failure") {
    ship.integrity = Math.max(15, ship.integrity - 12);
    ship.task.remainingDays += event.severity;
    ship.status = ship.integrity < 30 ? "stranded" : "damaged";
    state.alerts.push(`Falha de warp em ${ship.name}`);
    pushLog(state, "error", `${event.description} A viagem foi atrasada em ${event.severity} dias.`);
    return;
  }

  state.credits -= event.severity;
  contract.penalty += Math.round(event.severity * 0.5);
  state.alerts.push(`Crise logística: -${event.severity} créditos`);
  pushLog(state, "warn", `${event.description} Custo extra de ${event.severity} créditos aplicado.`);
}

function resolveDebt(state: CompanyState) {
  if (state.credits < 0) {
    state.debtDays += 1;
    state.alerts.push(`Empresa operando no vermelho há ${state.debtDays} dias.`);
    if (state.debtDays >= GameConfig.MAX_DEBT_DAYS) {
      state.gameOver = true;
      state.gameOverReason = "Falência operacional: a empresa permaneceu endividada por tempo demais.";
      pushLog(state, "error", state.gameOverReason);
    }
    return;
  }

  state.debtDays = 0;
}

function expireContracts(state: CompanyState, stars: Star[]) {
  const stillAvailable: Contract[] = [];
  state.availableContracts.forEach((contract) => {
    if (state.currentDay > contract.deadlineDay) {
      contract.status = "failed";
      state.failedContracts.push(contract);
      pushLog(
        state,
        "warn",
        `Contrato expirado: ${getStarName(stars, contract.originStarId)} -> ${getStarName(stars, contract.destinationStarId)}.`
      );
      return;
    }
    stillAvailable.push(contract);
  });
  state.availableContracts = stillAvailable;
}

function trimCollections(state: CompanyState) {
  state.logs = state.logs.slice(-GameConfig.MAX_LOG_ENTRIES);
  state.arisMessages = state.arisMessages.slice(-GameConfig.MAX_ARIS_MESSAGES);
  state.completedContracts = state.completedContracts.slice(-GameConfig.MAX_COMPLETED_CONTRACTS);
  state.failedContracts = state.failedContracts.slice(-GameConfig.MAX_FAILED_CONTRACTS);
}

function pickStartingStars(stars: Star[]) {
  return [...stars]
    .sort((left, right) => (Math.abs(left.x) + Math.abs(left.y)) - (Math.abs(right.x) + Math.abs(right.y)))
    .slice(0, GameConfig.STARTING_SHIPS.length);
}

export function findShortestPath(graph: StarGraph, originStarId: number, destinationStarId: number) {
  if (originStarId === destinationStarId) {
    return [originStarId];
  }

  const queue: number[][] = [[originStarId]];
  const visited = new Set<number>([originStarId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    const neighbors = graph.get(node) ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      const nextPath = [...path, neighbor];
      if (neighbor === destinationStarId) {
        return nextPath;
      }

      visited.add(neighbor);
      queue.push(nextPath);
    }
  }

  return [];
}

export function computePathDistance(path: number[], stars: Star[]) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const from = stars.find((star) => star.id === path[index - 1]);
    const to = stars.find((star) => star.id === path[index]);
    if (!from || !to) {
      continue;
    }
    total += Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
  }
  return total;
}

function pushLog(state: CompanyState, level: LogEntry["level"], message: string) {
  state.logs.push({
    id: `log-${state.currentDay}-${state.logs.length}-${level}`,
    day: state.currentDay,
    level,
    message
  });
}

function pushArisMessage(state: CompanyState, category: ArisMessage["category"], message: string) {
  state.arisMessages.push({
    id: `aris-${state.currentDay}-${state.arisMessages.length}-${category}`,
    day: state.currentDay,
    message,
    category
  });
}

function getStarName(stars: Star[], starId: number) {
  return stars.find((star) => star.id === starId)?.name ?? `Sistema ${starId}`;
}
