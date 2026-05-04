import { Region } from "../models/Region";
import { CompanyState, Contract, Ship } from "../types/AstroTransit";
import { Star } from "../types/MapData";
import { GameWorldLookup } from "../world/GameWorldLookup";

export interface OperationsHudContractRowViewModel {
  id: string;
  routeLabel: string;
  detailsLabel: string;
  actionLabel: string;
}

export interface OperationsHudFleetRowViewModel {
  id: string;
  name: string;
  detailsLabel: string;
  actionLabel: string;
  canRepair: boolean;
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
  };
  overviewLines: string[];
  alertsText: string;
  systemTitle: string;
  systemBodyLines: string[];
  fleetLines: string[];
  fleetRows: OperationsHudFleetRowViewModel[];
  logLines: string[];
  arisText: string;
  contracts: OperationsHudContractRowViewModel[];
}

export function buildOperationsHudViewModel(
  state: CompanyState,
  selectedStar: Star | null,
  selectedRegion: Region | null,
  contracts: Contract[],
  lookup: GameWorldLookup
): OperationsHudViewModel {
  return {
    topBar: {
      empire: "Astro Transit Directorate",
      date: `D${state.currentDay} . T${state.currentTick}`,
      credits: formatCompactNumber(state.credits),
      reputation: `${state.reputation}`,
      fleet: `${state.fleet.length}`,
      contracts: `${state.activeContracts.length}`,
      status: state.alerts.length > 0 ? `${state.alerts.length} alertas` : "Estavel"
    },
    overviewLines: [
      `Dia ${state.currentDay}  |  Tick ${state.currentTick}`,
      `Créditos: ${state.credits}`,
      `Reputação: ${state.reputation}`,
      `Frota ativa: ${state.fleet.length}`,
      `Contratos ativos: ${state.activeContracts.length}`
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
    fleetRows: state.fleet.map((ship) => buildFleetRowViewModel(ship, lookup)),
    logLines: state.logs.slice(-7).map((entry) => `[D${entry.day}] ${entry.message}`),
    arisText: state.arisMessages.length > 0
      ? `A.R.I.S.: ${state.arisMessages[state.arisMessages.length - 1].message}`
      : "A.R.I.S. aguardando novas diretrizes.",
    contracts: selectedStar
      ? contracts.map((contract) => buildContractRowViewModel(contract, lookup))
      : []
  };
}

function buildFleetRowViewModel(
  ship: Ship,
  lookup: GameWorldLookup
): OperationsHudFleetRowViewModel {
  const destination = ship.task ? lookup.getStar(ship.task.destinationStarId)?.name : "-";
  const eta = ship.task ? `${ship.task.remainingDays}d` : "-";
  const maintenance = ship.status === "maintenance" ? ` | Man ${ship.maintenanceDaysRemaining ?? 1}d` : "";

  return {
    id: ship.id,
    name: ship.name,
    detailsLabel: `${ship.status} | Int ${ship.integrity}% | Cap ${ship.capacity} | ETA ${eta} | Dest ${destination}${maintenance}`,
    actionLabel: "Reparar",
    canRepair: !ship.task && (ship.status === "idle" || ship.status === "damaged") && ship.integrity < 100
  };
}

function buildContractRowViewModel(
  contract: Contract,
  lookup: GameWorldLookup
): OperationsHudContractRowViewModel {
  const destinationRegion = contract.destinationRegionId ? lookup.getRegionById(contract.destinationRegionId) : undefined;

  return {
    id: contract.id,
    routeLabel: `${lookup.getStar(contract.originStarId)?.name} -> ${lookup.getStar(contract.destinationStarId)?.name}`,
    detailsLabel: `${destinationRegion?.name ?? "Regiao ?"} | Risco ${formatPercent(contract.risk)} | Taxa ${contract.routeTax ?? 0} | ${contract.reward}cr D${contract.deadlineDay}`,
    actionLabel: "Despachar"
  };
}

function formatFleetLine(ship: Ship, lookup: GameWorldLookup) {
  const destination = ship.task ? lookup.getStar(ship.task.destinationStarId)?.name : "-";
  const eta = ship.task ? `${ship.task.remainingDays}d` : "-";
  return `${ship.name} | ${ship.status} | Int ${ship.integrity}% | ETA ${eta} | Dest ${destination}`;
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
