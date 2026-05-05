import { Region } from "../models/Region";
import { CompanyState, Contract, Ship } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";
import { getCargoIconKey, getShipIconKey, getShipStatusIconKey } from "../utils/GameAssets";
import { Star } from "../types/MapData";
import { GameWorldLookup } from "../world/GameWorldLookup";

export type ContractFilterMode = "profit" | "distance" | "risk";

export interface OperationsHudContractRowViewModel {
  id: string;
  iconKey: string;
  routeLabel: string;
  detailsLabel: string;
  riskLabel: string;
  actionLabel: string;
  canDispatch: boolean;
  disabledReason?: string;
}

export interface OperationsHudShipyardRowViewModel {
  id: string;
  iconKey: string;
  name: string;
  detailsLabel: string;
  priceLabel: string;
  canPurchase: boolean;
}

export interface OperationsHudFleetRowViewModel {
  id: string;
  iconKey: string;
  statusIconKey: string;
  name: string;
  detailsLabel: string;
  actionLabel: string;
  action: "repair" | "relocate" | "rescue" | null;
  canAct: boolean;
}

export interface OperationsHudViewModel {
  topBar: {
    empire: string;
    date: string;
    credits: string;
    reputation: string;
    fleet: string;
    contracts: string;
    status: string;
    crisis: boolean;
  };
  overviewLines: string[];
  alertsText: string;
  systemTitle: string;
  systemBodyLines: string[];
  fleetLines: string[];
  fleetRows: OperationsHudFleetRowViewModel[];
  logLines: string[];
  hasCriticalLogs: boolean;
  auditText: string;
  contractFilterLabel: string;
  contracts: OperationsHudContractRowViewModel[];
  shipyardRows: OperationsHudShipyardRowViewModel[];
}

export function buildOperationsHudViewModel(
  state: CompanyState,
  selectedStar: Star | null,
  selectedRegion: Region | null,
  contracts: Contract[],
  lookup: GameWorldLookup,
  contractFilter: ContractFilterMode = "profit"
): OperationsHudViewModel {
  return {
    topBar: {
      empire: "Astro Transit Directorate",
      date: `D${state.currentDay} . T${state.currentTick}`,
      credits: formatCompactNumber(state.credits),
      reputation: `${state.reputation}`,
      fleet: `${state.fleet.length}`,
      contracts: `${state.activeContracts.length}`,
      status: state.alerts.length > 0 ? `${state.alerts.length} alertas` : "Estavel",
      crisis: state.credits < 0
    },
    overviewLines: [
      `Dia ${state.currentDay}  |  Tick ${state.currentTick}`,
      `Créditos: ${state.credits}`,
      `Reputação: ${state.reputation}`,
      `Frota ativa: ${state.fleet.length}`,
      `Contratos ativos: ${state.activeContracts.length}`,
      `Filtro: ${formatContractFilter(contractFilter)}`
    ],
    alertsText: state.alerts.length > 0 ? state.alerts.join(" | ") : "Status nominal. Nenhum alerta crítico.",
    systemTitle: selectedStar ? selectedStar.name ?? `Sistema ${selectedStar.id}` : "Nenhum sistema selecionado",
    systemBodyLines: selectedStar
      ? [
        `ID: ${selectedStar.id} | Regiao: ${selectedRegion?.name ?? "Nao mapeada"}`,
        `Coordenadas: ${selectedStar.x.toFixed(0)}, ${selectedStar.y.toFixed(0)}`,
        `Perigo: ${formatPercent(selectedRegion?.stats.danger)} | Pirataria: ${formatPercent(selectedRegion?.stats.piracy)}`,
        `Taxa: ${formatPercent(selectedRegion?.stats.tax)} | Seguranca: ${formatPercent(selectedRegion?.stats.security)}`,
        `Contratos locais: ${contracts.length}`
      ]
      : ["Selecione um sistema no mapa para ver contratos e despachar uma nave."],
    fleetLines: state.fleet.map((ship) => formatFleetLine(ship, lookup)),
    fleetRows: state.fleet.map((ship) => buildFleetRowViewModel(ship, lookup, selectedStar)),
    logLines: state.logs.slice(-7).map((entry) => `[D${entry.day}] ${entry.message}`),
    hasCriticalLogs: state.logs.slice(-4).some((entry) => entry.level === "error" || entry.level === "warn"),
    auditText: buildAuditText(state, lookup),
    contractFilterLabel: `Filtro: ${formatContractFilter(contractFilter)}`,
    contracts: selectedStar
      ? contracts.map((contract) => buildContractRowViewModel(contract, state, lookup))
      : [],
    shipyardRows: buildShipyardRows(state)
  };
}

function buildAuditText(
  state: CompanyState,
  lookup: GameWorldLookup
) {
  if (state.financialRecords.length === 0) {
    return "Auditoria: aguardando fluxo financeiro.";
  }

  const totalsByShip = new Map<string, number>();
  const expensesByRegion = new Map<string, number>();
  state.financialRecords.forEach((record) => {
    const signedAmount = record.type === "income" ? record.amount : -record.amount;
    if (record.shipId) {
      totalsByShip.set(record.shipId, (totalsByShip.get(record.shipId) ?? 0) + signedAmount);
    }

    if (record.regionId && record.type === "expense") {
      expensesByRegion.set(record.regionId, (expensesByRegion.get(record.regionId) ?? 0) + record.amount);
    }
  });

  const bestShip = [...totalsByShip.entries()].sort((left, right) => right[1] - left[1])[0];
  const worstRegion = [...expensesByRegion.entries()].sort((left, right) => right[1] - left[1])[0];
  const bestShipName = bestShip ? state.fleet.find((ship) => ship.id === bestShip[0])?.name ?? bestShip[0] : "-";
  const worstRegionName = worstRegion ? lookup.getRegionById(worstRegion[0])?.name ?? worstRegion[0] : "-";

  return `Auditoria: nave +lucrativa ${bestShipName} (${bestShip?.[1] ?? 0}cr) | região drenando ${worstRegionName} (${worstRegion?.[1] ?? 0}cr)`;
}

function buildFleetRowViewModel(
  ship: Ship,
  lookup: GameWorldLookup,
  selectedStar: Star | null
): OperationsHudFleetRowViewModel {
  const destination = ship.task ? lookup.getStar(ship.task.destinationStarId)?.name : "-";
  const eta = ship.task ? `${ship.task.remainingDays}d` : "-";
  const maintenance = ship.status === "maintenance" ? ` | Man ${ship.maintenanceDaysRemaining ?? 1}d` : "";
  const canRepair = !ship.task && (ship.status === "idle" || ship.status === "damaged") && ship.integrity < 100;
  const canRelocate = Boolean(selectedStar) && !ship.task && (ship.status === "idle" || ship.status === "damaged") && selectedStar?.id !== ship.currentStarId;
  const canRescue = ship.status === "stranded";
  const action = canRescue ? "rescue" : canRepair ? "repair" : canRelocate ? "relocate" : null;
  const actionLabel = action === "rescue" ? "SOS" : action === "repair" ? "Reparar" : action === "relocate" ? "Mover" : "Sem acao";

  return {
    id: ship.id,
    iconKey: getShipIconKey(ship.typeId, ship.name),
    statusIconKey: getShipStatusIconKey(ship.status, ship.integrity),
    name: ship.name,
    detailsLabel: `${ship.status} | Int ${ship.integrity}% | Cap ${ship.capacity} | Vel ${ship.speed} | XP ${ship.flightExperience ?? 0} | ETA ${eta} | Dest ${destination}${maintenance}`,
    actionLabel,
    action,
    canAct: action !== null
  };
}

function buildContractRowViewModel(
  contract: Contract,
  state: CompanyState,
  lookup: GameWorldLookup
): OperationsHudContractRowViewModel {
  const destinationRegion = contract.destinationRegionId ? lookup.getRegionById(contract.destinationRegionId) : undefined;
  const availableShips = state.fleet.filter((ship) => {
    const canDispatch = ship.status === "idle" || ship.status === "damaged";
    return canDispatch && !ship.task && ship.currentStarId === contract.originStarId;
  });
  const hasShip = availableShips.length > 0;
  const hasCapacity = availableShips.some((ship) => contract.cargoUnits <= ship.capacity);

  return {
    id: contract.id,
    iconKey: getCargoIconKey(contract.cargoType),
    routeLabel: `${lookup.getStar(contract.originStarId)?.name} -> ${lookup.getStar(contract.destinationStarId)?.name}`,
    detailsLabel: `${GameConfig.CARGO_TYPES[contract.cargoType].label} | ${destinationRegion?.name ?? "Regiao ?"} | Risco ${formatPercent(contract.routeRisk ?? contract.risk)} | Taxa ${contract.routeTax ?? 0} | ${contract.reward}cr D${contract.deadlineDay}`,
    riskLabel: `Probabilidade de dano estrutural: ${Math.round(Math.max(0.03, contract.routeRisk ?? contract.risk) * 100)}%`,
    actionLabel: hasCapacity ? "Despachar" : hasShip ? "Capacidade" : "Sem nave",
    canDispatch: hasCapacity,
    disabledReason: hasCapacity ? undefined : hasShip ? "Nenhuma nave local comporta esta carga." : "Nenhuma nave livre neste sistema."
  };
}

function formatFleetLine(ship: Ship, lookup: GameWorldLookup) {
  const destination = ship.task ? lookup.getStar(ship.task.destinationStarId)?.name : "-";
  const eta = ship.task ? `${ship.task.remainingDays}d` : "-";
  return `${ship.name} | ${ship.status} | Int ${ship.integrity}% | ETA ${eta} | Dest ${destination}`;
}

function buildShipyardRows(state: CompanyState): OperationsHudShipyardRowViewModel[] {
  return GameConfig.SHIP_CATALOG.map((shipType) => ({
    id: shipType.id,
    iconKey: getShipIconKey(shipType.id, shipType.name),
    name: shipType.name,
    detailsLabel: `Cap ${shipType.capacity} | Vel ${shipType.speed} | Man ${shipType.maintenanceCost} | Rev ${shipType.resaleValue}`,
    priceLabel: `${shipType.purchasePrice}cr`,
    canPurchase: state.credits >= shipType.purchasePrice
  }));
}

function formatContractFilter(filter: ContractFilterMode) {
  if (filter === "distance") {
    return "Distancia";
  }

  if (filter === "risk") {
    return "Risco";
  }

  return "Lucro";
}

function formatPercent(value?: number) {
  return value === undefined ? "--" : `${Math.round(value * 100)}%`;
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${value}`;
}
