import { GameConfig } from "../utils/GameConfig";
import { SimulationRuntimeContext } from "./context";
import { pushFinancialRecord } from "./runtime";
import { getEffectiveShipSpeed } from "./shipStats";
import { maybeTriggerTravelEvent } from "./travelEvents";

export function resolveTravel(
  context: SimulationRuntimeContext
) {
  const { state, starLookup, regionLookup, pushLog, getStarName } = context;
  state.fleet.forEach((ship) => {
    if (!ship.task) {
      return;
    }

    maybeTriggerTravelEvent(state, ship, starLookup, regionLookup, {
      pushLog,
      pushArisMessage: () => undefined,
      getStarName
    });

    if (ship.status === "stranded") {
      return;
    }

    const effectiveSpeed = getEffectiveShipSpeed(ship);
    ship.task.remainingDistance = Math.max(0, ship.task.remainingDistance - effectiveSpeed);
    ship.task.remainingDays = Math.ceil(ship.task.remainingDistance / effectiveSpeed);

    if (ship.task.remainingDistance > 0) {
      return;
    }

    const task = ship.task;
    const contractIndex = state.activeContracts.findIndex((contract) => contract.id === task.contractId);
    if (contractIndex === -1) {
      ship.currentStarId = task.destinationStarId;
      ship.task = undefined;
      ship.status = "idle";
      pushLog(state, "info", `${ship.name} concluiu reposicionamento em ${getStarName(starLookup, task.destinationStarId)}.`);
      return;
    }

    const contract = state.activeContracts[contractIndex];
    ship.currentStarId = task.destinationStarId;
    ship.task = undefined;
    ship.status = ship.integrity < 45 ? "damaged" : "idle";

    const delayDays = Math.max(state.currentDay - contract.deadlineDay, 0);
    const successBonus = ship.integrity > 80 ? GameConfig.EVENTS.SAFE_ARRIVAL_BONUS : 0;
    const perishablePenalty = contract.cargoType === "perishables"
      ? delayDays * GameConfig.PERISHABLE_LATE_PENALTY_PER_DAY
      : 0;
    const latePenalty = delayDays * GameConfig.LATE_DELIVERY_PENALTY_PER_DAY + perishablePenalty;
    const payout = delayDays > 0
      ? Math.max(0, contract.reward - latePenalty - contract.penalty)
      : contract.reward + successBonus;

    state.credits += payout;
    pushFinancialRecord(
      state,
      "income",
      payout,
      `${contract.title}: pagamento ${contract.reward} + bônus ${successBonus} - multa ${latePenalty + (delayDays > 0 ? contract.penalty : 0)}`,
      { shipId: ship.id, regionId: contract.destinationRegionId }
    );
    state.reputation += delayDays > 0 ? -2 : 3;
    if (contract.destinationRegionId) {
      const currentRegionReputation = state.regionalReputation[contract.destinationRegionId] ?? 50;
      state.regionalReputation[contract.destinationRegionId] = Math.max(
        0,
        Math.min(100, currentRegionReputation + (delayDays > 0 ? -2 : 3))
      );
    }
    ship.flightExperience += delayDays > 0 ? 2 : GameConfig.CREW_EXPERIENCE_GAIN_PER_DELIVERY;

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
      `${ship.name} chegou a ${getStarName(starLookup, task.destinationStarId)}. Resultado financeiro: ${payout} créditos.`
    );

    if (!state.tutorialFlags.firstDispatchCompleted) {
      state.tutorialFlags.firstDispatchCompleted = true;
      pushLog(state, "info", "Primeira entrega concluída. Agora precisamos equilibrar risco, manutenção e reputação.");
    }
  });
}
