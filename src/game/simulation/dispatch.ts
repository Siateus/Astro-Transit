import { Contract, Ship, TravelTask } from "../types/AstroTransit";
import { SimulationLogContext } from "./context";
import { computeRouteProfile } from "./routing";
import { pushFinancialRecord } from "./runtime";
import { getEffectiveShipSpeed } from "./shipStats";

export interface DispatchResult {
  ok: boolean;
  message: string;
  contract?: Contract;
  ship?: Ship;
}

export function dispatchContract(
  contractId: string,
  context: SimulationLogContext
): DispatchResult {
  const { state, starLookup, navigation, regionLookup, pushLog, getStarName } = context;
  const contractIndex = state.availableContracts.findIndex((contract) => contract.id === contractId);
  if (contractIndex === -1) {
    return { ok: false, message: "Contrato não encontrado." };
  }

  const contract = state.availableContracts[contractIndex];
  const availableShips = state.fleet.filter((candidate) => {
    const canDispatch = candidate.status === "idle" || candidate.status === "damaged";
    return canDispatch && candidate.currentStarId === contract.originStarId && !candidate.task;
  });
  if (availableShips.length === 0) {
    return {
      ok: false,
      message: "Nenhuma nave disponível neste sistema. Leve uma nave para cá ou escolha outro contrato."
    };
  }

  const ship = availableShips.find((candidate) => contract.cargoUnits <= candidate.capacity);
  if (!ship) {
    return { ok: false, message: "Nave insuficiente para o volume de carga" };
  }

  const path = navigation.findShortestPath(contract.originStarId, contract.destinationStarId);
  if (path.length === 0) {
    return { ok: false, message: "Rota indisponível pelas starlanes." };
  }

  const totalDistance = navigation.computePathDistance(path);
  const routeProfile = computeRouteProfile(path, regionLookup, state.regionalReputation);
  const operatingCost = Math.round(totalDistance * ship.operatingCostPerDistance * routeProfile.logisticsMultiplier);
  if (state.credits < operatingCost) {
    return { ok: false, message: "Créditos insuficientes para cobrir os custos operacionais desta viagem." };
  }

  state.credits -= operatingCost;
  pushFinancialRecord(
    state,
    "expense",
    operatingCost,
    `Custo operacional ${ship.name}: ${getStarName(starLookup, contract.originStarId)} -> ${getStarName(starLookup, contract.destinationStarId)}`,
    { shipId: ship.id, regionId: routeProfile.originRegionId }
  );

  const totalEtaDays = Math.max(1, Math.ceil(totalDistance / getEffectiveShipSpeed({ ...ship, integrity: 100 })));
  const task: TravelTask = {
    shipId: ship.id,
    contractId: contract.id,
    originStarId: contract.originStarId,
    destinationStarId: contract.destinationStarId,
    path,
    totalDistance,
    remainingDistance: totalDistance,
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
    `${ship.name} partiu de ${getStarName(starLookup, contract.originStarId)} rumo a ${getStarName(starLookup, contract.destinationStarId)}. ETA: ${totalEtaDays} dias.`
  );

  return {
    ok: true,
    message: `${ship.name} despachada com sucesso.`,
    contract,
    ship
  };
}
