import Phaser from "phaser";
import { CargoType } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { SimulationContext } from "./context";
import { computeRouteProfile } from "./routing";

export function refillContracts(
  context: Pick<SimulationContext, "state" | "stars" | "navigation" | "regionLookup">
) {
  const { state, stars, navigation, regionLookup } = context;
  const rng = new Phaser.Math.RandomDataGenerator([`contracts-${state.currentDay}-${state.currentTick}`]);
  const desiredContracts = GameConfig.MAX_AVAILABLE_CONTRACTS;
  const idleOrigins = [...new Set(state.fleet
    .filter((ship) => !ship.task && (ship.status === "idle" || ship.status === "damaged"))
    .map((ship) => ship.currentStarId))];
  if (idleOrigins.length === 0) {
    return;
  }

  let attempts = 0;
  while (state.availableContracts.length < desiredContracts) {
    attempts += 1;
    if (attempts > desiredContracts * 20) {
      return;
    }

    const originStarId = rng.pick(idleOrigins);
    const destinationStar = rng.pick(stars.filter((star) => star.id !== originStarId));
    const path = navigation.findShortestPath(originStarId, destinationStar.id);
    if (path.length === 0) {
      continue;
    }

    const totalDistance = navigation.computePathDistance(path);
    const routeProfile = computeRouteProfile(path, regionLookup, state.regionalReputation);
    const cargoType = pickCargoType(rng, routeProfile.destinationRegionId);
    const cargoConfig = GameConfig.CARGO_TYPES[cargoType];
    const etaDays = Math.max(1, Math.ceil(totalDistance / GameConfig.CONTRACT_REFERENCE_SPEED));
    const cargoUnits = rng.between(10, 40);
    const risk = Phaser.Math.Clamp(
      (path.length - 1) * 0.08 + rng.realInRange(0.04, 0.18) + routeProfile.riskModifier + cargoConfig.riskModifier,
      0.08,
      cargoType === "illegal" ? 0.92 : 0.82
    );
    const routeTax = Math.round((totalDistance * GameConfig.CONTRACT_TAX_PER_DISTANCE) * routeProfile.taxMultiplier);
    const logisticsBonus = Math.round(cargoUnits * GameConfig.CONTRACT_LOGISTICS_BONUS_PER_CARGO * routeProfile.logisticsMultiplier);
    const baseReward = (
      (totalDistance * GameConfig.CONTRACT_REWARD_PER_DISTANCE)
      + (cargoUnits * GameConfig.CONTRACT_REWARD_PER_CARGO)
      + logisticsBonus
      - routeTax
    ) * cargoConfig.rewardMultiplier;

    state.availableContracts.push({
      id: `contract-${state.currentDay}-${state.availableContracts.length}-${destinationStar.id}`,
      title: `${cargoConfig.label}: ${destinationStar.name ?? `Sistema ${destinationStar.id}`}`,
      originStarId,
      destinationStarId: destinationStar.id,
      cargoType,
      cargoUnits,
      reward: Math.round(baseReward),
      penalty: Math.round((totalDistance * GameConfig.CONTRACT_PENALTY_PER_DISTANCE) + 120 + routeTax),
      risk,
      routeRisk: routeProfile.averageRiskScore,
      deadlineDay: state.currentDay + etaDays + rng.between(2, 5),
      status: "available",
      etaDays,
      originRegionId: routeProfile.originRegionId,
      destinationRegionId: routeProfile.destinationRegionId,
      routeTax
    });
  }
}

function pickCargoType(rng: Phaser.Math.RandomDataGenerator, destinationRegionId?: string): CargoType {
  const weightedCargo: CargoType[] = ["basic_supplies", "luxury_goods", "perishables", "fragile"];
  if (destinationRegionId === "frontier") {
    weightedCargo.push("basic_supplies", "basic_supplies", "perishables");
  }

  if (destinationRegionId === "core") {
    weightedCargo.push("luxury_goods", "luxury_goods", "fragile", "illegal");
  }

  if (destinationRegionId === "rim") {
    weightedCargo.push("illegal", "basic_supplies");
  }

  return rng.pick(weightedCargo);
}
