import Phaser from "phaser";
import { CompanyState, Contract, EventType, GameEvent, Ship } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { computeRouteProfile, RouteProfile } from "./routing";
import { RegionLookup } from "./regionLookup";
import { SimulationRuntimeDependencies } from "./runtime";
import { StarLookup } from "./starLookup";

export function maybeTriggerTravelEvent(
  state: CompanyState,
  ship: Ship,
  starLookup: StarLookup,
  regionLookup: RegionLookup | undefined,
  dependencies: SimulationRuntimeDependencies
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
  const routeProfile = computeRouteProfile(ship.task.path, regionLookup);
  const threshold = Phaser.Math.Clamp(
    contract.risk * GameConfig.TRAVEL_EVENT_FACTOR * routeProfile.eventMultiplier,
    0.02,
    0.72
  );
  if (roll >= threshold) {
    return;
  }

  const eventType = pickRouteEventType(rng, routeProfile);
  const event = createEvent(eventType, state.currentDay, ship, contract, starLookup, rng, routeProfile, dependencies.getStarName);
  applyEvent(state, ship, contract, event, dependencies);
}

function createEvent(
  type: EventType,
  day: number,
  ship: Ship,
  contract: Contract,
  starLookup: StarLookup,
  rng: Phaser.Math.RandomDataGenerator,
  routeProfile: RouteProfile,
  getStarName: SimulationRuntimeDependencies["getStarName"]
): GameEvent {
  if (type === "pirates") {
    return {
      id: `${type}-${ship.id}-${day}`,
      day,
      type,
      severity: Math.round(rng.between(10, 24) * routeProfile.piracyMultiplier),
      description: `Piratas emboscaram ${ship.name} perto de ${getStarName(starLookup, ship.task?.destinationStarId ?? contract.destinationStarId)}.`
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

function pickRouteEventType(rng: Phaser.Math.RandomDataGenerator, routeProfile: RouteProfile) {
  const pirateWeight = routeProfile.piracyMultiplier > 1.4 ? 4 : 2;
  const weightedEvents: EventType[] = [
    ...Array(pirateWeight).fill("pirates"),
    "warp_failure",
    "logistics_crisis"
  ];
  return rng.pick(weightedEvents);
}

function applyEvent(
  state: CompanyState,
  ship: Ship,
  contract: Contract,
  event: GameEvent,
  dependencies: SimulationRuntimeDependencies
) {
  if (!ship.task) {
    return;
  }

  if (!state.tutorialFlags.firstEventSeen) {
    state.tutorialFlags.firstEventSeen = true;
    dependencies.pushArisMessage(
      state,
      "alert",
      "Eventos de rota alteram lucro, prazo e integridade. Adapte sua operação rapidamente."
    );
  }

  if (event.type === "pirates") {
    ship.integrity = Math.max(10, ship.integrity - event.severity);
    addDelayDistance(ship, 1);
    state.credits -= GameConfig.PIRATE_ATTACK_COST;
    state.alerts.push(`Ataque pirata em ${ship.name}`);
    dependencies.pushLog(state, "warn", `${event.description} Integridade reduzida para ${ship.integrity}%.`);
    return;
  }

  if (event.type === "warp_failure") {
    ship.integrity = Math.max(15, ship.integrity - 12);
    addDelayDistance(ship, event.severity);
    ship.status = ship.integrity < 30 ? "stranded" : "damaged";
    state.alerts.push(`Falha de warp em ${ship.name}`);
    dependencies.pushLog(state, "error", `${event.description} A viagem foi atrasada em ${event.severity} dias.`);
    return;
  }

  state.credits -= event.severity;
  contract.penalty += Math.round(event.severity * 0.5);
  state.alerts.push(`Crise logística: -${event.severity} créditos`);
  dependencies.pushLog(state, "warn", `${event.description} Custo extra de ${event.severity} créditos aplicado.`);
}

function addDelayDistance(ship: Ship, days: number) {
  if (!ship.task) {
    return;
  }

  const effectiveSpeed = Math.max(1, ship.speed * (ship.integrity / 100));
  ship.task.remainingDistance += effectiveSpeed * days;
  ship.task.remainingDays = Math.ceil(ship.task.remainingDistance / effectiveSpeed);
}
