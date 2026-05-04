import Phaser from "phaser";
import { GameConfig } from "../utils/GameConfig";
import { SimulationContext } from "./context";
import { computeRouteProfile } from "./routing";

export function refillContracts(
  context: Pick<SimulationContext, "state" | "stars" | "navigation" | "regionLookup">
) {
  const { state, stars, navigation, regionLookup } = context;
  const rng = new Phaser.Math.RandomDataGenerator([`contracts-${state.currentDay}-${state.currentTick}`]);
  const desiredContracts = GameConfig.MAX_AVAILABLE_CONTRACTS;
  const idleOrigins = [...new Set(state.fleet.map((ship) => ship.currentStarId))];

  while (state.availableContracts.length < desiredContracts) {
    const originStarId = rng.pick(idleOrigins);
    const destinationStar = rng.pick(stars.filter((star) => star.id !== originStarId));
    const path = navigation.findShortestPath(originStarId, destinationStar.id);
    if (path.length === 0) {
      continue;
    }

    const totalDistance = navigation.computePathDistance(path);
    const routeProfile = computeRouteProfile(path, regionLookup);
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
