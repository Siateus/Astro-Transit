import { GameConfig } from "../utils/GameConfig";
import { SimulationRuntimeContext } from "./context";
import { maybeTriggerTravelEvent } from "./travelEvents";

export function resolveTravel(
  context: SimulationRuntimeContext
) {
  const { state, starLookup, regionLookup, pushLog, pushArisMessage, getStarName } = context;
  state.fleet.forEach((ship) => {
    if (!ship.task) {
      return;
    }

    maybeTriggerTravelEvent(state, ship, starLookup, regionLookup, {
      pushLog,
      pushArisMessage,
      getStarName
    });

    if (ship.status === "stranded") {
      return;
    }

    const effectiveSpeed = Math.max(1, ship.speed * (ship.integrity / 100));
    ship.task.remainingDistance = Math.max(0, ship.task.remainingDistance - effectiveSpeed);
    ship.task.remainingDays = Math.ceil(ship.task.remainingDistance / effectiveSpeed);

    if (ship.task.remainingDistance > 0) {
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
      `${ship.name} chegou a ${getStarName(starLookup, task.destinationStarId)}. Resultado financeiro: ${payout} créditos.`
    );

    if (!state.tutorialFlags.firstDispatchCompleted) {
      state.tutorialFlags.firstDispatchCompleted = true;
      pushArisMessage(
        state,
        "status",
        "Primeira entrega concluída. Agora precisamos equilibrar risco, manutenção e reputação."
      );
    }
  });
}
