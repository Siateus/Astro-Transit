import { Ship } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { SimulationLogContext } from "./context";
import { pushFinancialRecord } from "./runtime";

export interface ShipPurchaseResult {
  ok: boolean;
  message: string;
  ship?: Ship;
}

export function purchaseShip(
  context: SimulationLogContext,
  shipTypeId: string,
  dockStarId?: number
): ShipPurchaseResult {
  const { state, stars, pushLog, getStarName, starLookup } = context;
  const catalogEntry = GameConfig.SHIP_CATALOG.find((shipType) => shipType.id === shipTypeId);
  if (!catalogEntry) {
    return { ok: false, message: "Modelo de nave não encontrado no estaleiro." };
  }

  if (state.credits < catalogEntry.purchasePrice) {
    return { ok: false, message: "Créditos insuficientes para comprar esta nave." };
  }

  const currentStarId = dockStarId
    ?? state.fleet.find((ship) => !ship.task)?.currentStarId
    ?? stars[0]?.id;
  if (currentStarId === undefined) {
    return { ok: false, message: "Nenhum estaleiro disponível no mapa atual." };
  }

  const serial = state.fleet.filter((ship) => ship.typeId === catalogEntry.id).length + 1;
  const ship: Ship = {
    id: `ship-${state.currentDay}-${state.currentTick}-${state.fleet.length + 1}`,
    typeId: catalogEntry.id,
    name: `${catalogEntry.name} ${serial}`,
    currentStarId,
    status: "idle",
    integrity: 100,
    capacity: catalogEntry.capacity,
    speed: catalogEntry.speed,
    maintenanceCost: catalogEntry.maintenanceCost,
    operatingCostPerDistance: catalogEntry.operatingCostPerDistance,
    purchasePrice: catalogEntry.purchasePrice,
    resaleValue: catalogEntry.resaleValue,
    equipmentSlots: catalogEntry.equipmentSlots.map((module) => ({ ...module })),
    flightExperience: 0
  };

  state.credits -= catalogEntry.purchasePrice;
  state.fleet.push(ship);
  pushFinancialRecord(state, "expense", catalogEntry.purchasePrice, `Compra de nave ${ship.name}`, { shipId: ship.id });
  pushLog(state, "success", `${ship.name} incorporada ao estaleiro de ${getStarName(starLookup, currentStarId)}.`);

  return {
    ok: true,
    message: `${ship.name} comprada com sucesso.`,
    ship
  };
}
