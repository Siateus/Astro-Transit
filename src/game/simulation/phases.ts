import { SimulationContext } from "./context";
import { refillContracts } from "./contracts";
import { expireContracts, trimCollections } from "./lifecycle";
import { applyMaintenanceCosts, resolveActiveMaintenance, resolveDebt } from "./operations";
import { getStarName, pushArisMessage, pushLog } from "./runtime";
import { resolveTravel } from "./travelResolution";

export function runMaintenancePhase(context: SimulationContext) {
  applyMaintenanceCosts(context.state, { pushLog });
  resolveActiveMaintenance(context.state, { pushLog });
}

export function runTravelPhase(context: SimulationContext) {
  resolveTravel({
    ...context,
    pushLog,
    pushArisMessage,
    getStarName
  });
}

export function runDebtPhase(context: SimulationContext) {
  resolveDebt(context.state, { pushLog });
}

export function runContractRefreshPhase(context: SimulationContext) {
  expireContracts({
    ...context,
    pushLog,
    getStarName
  });
  refillContracts(context);
}

export function runCleanupPhase(context: SimulationContext) {
  trimCollections(context.state);
}
