import { CompanyState, Contract } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { SimulationLogContext } from "./context";

export function expireContracts(context: SimulationLogContext) {
  const { state, starLookup, pushLog, getStarName } = context;
  const stillAvailable: Contract[] = [];
  state.availableContracts.forEach((contract) => {
    if (state.currentDay > contract.deadlineDay) {
      contract.status = "failed";
      state.failedContracts.push(contract);
      pushLog(
        state,
        "warn",
        `Contrato expirado: ${getStarName(starLookup, contract.originStarId)} -> ${getStarName(starLookup, contract.destinationStarId)}.`
      );
      return;
    }
    stillAvailable.push(contract);
  });
  state.availableContracts = stillAvailable;
}

export function trimCollections(state: CompanyState) {
  state.logs = state.logs.slice(-GameConfig.MAX_LOG_ENTRIES);
  state.arisMessages = state.arisMessages.slice(-GameConfig.MAX_ARIS_MESSAGES);
  state.completedContracts = state.completedContracts.slice(-GameConfig.MAX_COMPLETED_CONTRACTS);
  state.failedContracts = state.failedContracts.slice(-GameConfig.MAX_FAILED_CONTRACTS);
}
