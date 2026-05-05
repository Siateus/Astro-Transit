import Phaser from "phaser";
import { Region } from "../models/Region";
import { CompanyState, Contract, EventType, GameEvent, Ship } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { RegionLookup } from "./regionLookup";
import { pushFinancialRecord, SimulationRuntimeDependencies } from "./runtime";
import { getEffectiveShipSpeed, getPirateDamageMultiplier, getWarpFailureReduction } from "./shipStats";
import { StarLookup } from "./starLookup";

interface TravelRiskProfile {
  region?: Region;
  riskScore: number;
  danger: number;
  piracy: number;
  security: number;
  logistics: number;
}

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
  const riskProfile = resolveCurrentRiskProfile(ship, starLookup, regionLookup);
  const illegalSecurityRisk = contract.cargoType === "illegal"
    ? riskProfile.security * GameConfig.ILLEGAL_SECURITY_EVENT_MULTIPLIER * 0.16
    : 0;
  const threshold = Phaser.Math.Clamp(riskProfile.riskScore + illegalSecurityRisk, 0.02, 0.82);
  if (roll >= threshold) {
    return;
  }

  const eventType = pickRouteEventType(rng, riskProfile, ship, contract);
  const event = createEvent(eventType, state.currentDay, ship, contract, starLookup, rng, riskProfile, dependencies.getStarName);
  applyEvent(state, ship, contract, event, dependencies);
}

function createEvent(
  type: EventType,
  day: number,
  ship: Ship,
  contract: Contract,
  starLookup: StarLookup,
  rng: Phaser.Math.RandomDataGenerator,
  riskProfile: TravelRiskProfile,
  getStarName: SimulationRuntimeDependencies["getStarName"]
): GameEvent {
  const regionLabel = riskProfile.region ? ` em ${riskProfile.region.name}` : "";
  if (type === "pirates") {
    return {
      id: `${type}-${ship.id}-${day}`,
      day,
      type,
      severity: Math.round(rng.between(10, 24) * (1 + riskProfile.piracy)),
      description: `Piratas emboscaram ${ship.name}${regionLabel}, perto de ${getStarName(starLookup, ship.task?.destinationStarId ?? contract.destinationStarId)}.`
    };
  }

  if (type === "warp_failure") {
    return {
      id: `${type}-${ship.id}-${day}`,
      day,
      type,
      severity: rng.between(1, riskProfile.danger > 0.65 ? 3 : 2),
      description: `O warp drive de ${ship.name} apresentou falha crítica${regionLabel}.`
    };
  }

  if (type === "police_interception") {
    return {
      id: `${type}-${ship.id}-${day}`,
      day,
      type,
      severity: Math.round(rng.between(110, 260) * (1 + riskProfile.security)),
      description: `Intercepcao policial bloqueou ${ship.name}${regionLabel} durante transporte irregular.`
    };
  }

  return {
    id: `${type}-${ship.id}-${day}`,
    day,
    type,
    severity: Math.round(rng.between(80, 180) * (1 + Math.max(0, 0.5 - riskProfile.logistics))),
    description: `Crise logística elevou custos de suporte para ${ship.name}${regionLabel}.`
  };
}

function pickRouteEventType(
  rng: Phaser.Math.RandomDataGenerator,
  riskProfile: TravelRiskProfile,
  ship: Ship,
  contract: Contract
) {
  const pirateWeight = Math.max(1, Math.round(riskProfile.piracy * 5));
  const warpRisk = Math.max(0.1, riskProfile.danger + (1 - riskProfile.security) - getWarpFailureReduction(ship));
  const warpWeight = Math.max(1, Math.round(warpRisk * 3));
  const logisticsWeight = Math.max(1, Math.round((1 - riskProfile.logistics) * 4));
  const policeWeight = contract.cargoType === "illegal"
    ? Math.max(2, Math.round(riskProfile.security * 8))
    : 0;
  const weightedEvents: EventType[] = [
    ...Array(pirateWeight).fill("pirates"),
    ...Array(warpWeight).fill("warp_failure"),
    ...Array(logisticsWeight).fill("logistics_crisis"),
    ...Array(policeWeight).fill("police_interception")
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
    dependencies.pushLog(state, "warn", "Eventos de rota alteram lucro, prazo e integridade. Adapte sua operação rapidamente.");
  }

  if (event.type === "pirates") {
    const damage = Math.round(event.severity * getPirateDamageMultiplier(ship));
    ship.integrity = Math.max(10, ship.integrity - damage);
    addDelayDistance(ship, 1);
    state.credits -= GameConfig.PIRATE_ATTACK_COST;
    pushFinancialRecord(state, "expense", GameConfig.PIRATE_ATTACK_COST, `Subornos e evasão após ataque pirata em ${ship.name}`, { shipId: ship.id });
    state.alerts.push(`Ataque pirata em ${ship.name}`);
    applyFragileCargoDamage(state, ship, contract, damage, dependencies);
    dependencies.pushLog(state, "warn", `${event.description} Integridade reduzida para ${ship.integrity}%.`);
    return;
  }

  if (event.type === "warp_failure") {
    const damage = 12;
    ship.integrity = Math.max(15, ship.integrity - damage);
    addDelayDistance(ship, event.severity);
    ship.status = ship.integrity < 30 ? "stranded" : "damaged";
    state.alerts.push(`Falha de warp em ${ship.name}`);
    applyFragileCargoDamage(state, ship, contract, damage, dependencies);
    dependencies.pushLog(state, "error", `${event.description} A viagem foi atrasada em ${event.severity} dias.`);
    return;
  }

  if (event.type === "police_interception") {
    addDelayDistance(ship, 1);
    state.credits -= event.severity;
    contract.penalty += Math.round(event.severity * 0.75);
    pushFinancialRecord(state, "expense", event.severity, `Multas e propinas apos intercepcao em ${ship.name}`, { shipId: ship.id });
    state.alerts.push(`Intercepcao policial: -${event.severity} creditos`);
    dependencies.pushLog(state, "error", `${event.description} Multa de ${event.severity} créditos aplicada.`);
    return;
  }

  state.credits -= event.severity;
  pushFinancialRecord(state, "expense", event.severity, `Custo logístico emergencial em ${ship.name}`, { shipId: ship.id });
  contract.penalty += Math.round(event.severity * 0.5);
  state.alerts.push(`Crise logística: -${event.severity} créditos`);
  dependencies.pushLog(state, "warn", `${event.description} Custo extra de ${event.severity} créditos aplicado.`);
}

function addDelayDistance(ship: Ship, days: number) {
  if (!ship.task) {
    return;
  }

  const effectiveSpeed = getEffectiveShipSpeed(ship);
  ship.task.remainingDistance += effectiveSpeed * days;
  ship.task.remainingDays = Math.ceil(ship.task.remainingDistance / effectiveSpeed);
}

function applyFragileCargoDamage(
  state: CompanyState,
  ship: Ship,
  contract: Contract,
  damage: number,
  dependencies: SimulationRuntimeDependencies
) {
  if (contract.cargoType !== "fragile") {
    return;
  }

  const valueLoss = Math.round(contract.reward * GameConfig.FRAGILE_DAMAGE_PENALTY_MULTIPLIER * (damage / 100));
  contract.reward = Math.max(0, contract.reward - valueLoss);
  state.alerts.push(`Carga fragil avariada em ${ship.name}`);
  dependencies.pushLog(state, "warn", `Carga fragil perdeu ${valueLoss} créditos de valor após dano estrutural em ${ship.name}.`);
}

function resolveCurrentRiskProfile(
  ship: Ship,
  starLookup: StarLookup,
  regionLookup?: RegionLookup
): TravelRiskProfile {
  if (!ship.task) {
    return createFallbackRiskProfile();
  }

  const traveledDistance = Math.max(0, ship.task.totalDistance - ship.task.remainingDistance);
  const region = regionLookup?.getRegionAtRouteProgress?.(ship.task.path, traveledDistance, starLookup)
    ?? regionLookup?.getRegionByStarId(ship.currentStarId);
  if (!region) {
    return createFallbackRiskProfile();
  }

  return {
    region,
    riskScore: region.getRiskModifier(),
    danger: region.stats.danger,
    piracy: region.stats.piracy,
    security: region.stats.security,
    logistics: region.stats.logistics
  };
}

function createFallbackRiskProfile(): TravelRiskProfile {
  return {
    riskScore: 0.08,
    danger: 0.2,
    piracy: 0.1,
    security: 0.55,
    logistics: 0.65
  };
}
