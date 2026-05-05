import { CompanyState } from "../types/AstroTransit";

const SAVE_KEY = "astro_transit_save";
const SAVE_VERSION = 1;

interface SavePayload {
  version: number;
  savedAt: string;
  state: CompanyState;
}

export class PersistenceManager {
  static hasSave() {
    return this.loadState() !== null;
  }

  static saveState(state: CompanyState) {
    if (!isLocalStorageAvailable()) {
      return;
    }

    const payload: SavePayload = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  static loadState(): CompanyState | null {
    if (!isLocalStorageAvailable()) {
      return null;
    }

    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const payload = JSON.parse(raw) as SavePayload;
      if (payload.version !== SAVE_VERSION || !payload.state) {
        return null;
      }

      return hydrateCompanyState(payload.state);
    } catch {
      return null;
    }
  }

  static clearSave() {
    if (!isLocalStorageAvailable()) {
      return;
    }

    window.localStorage.removeItem(SAVE_KEY);
  }
}

function hydrateCompanyState(state: CompanyState): CompanyState {
  return {
    ...state,
    diasNoVermelho: state.diasNoVermelho ?? state.debtDays ?? 0,
    financialRecords: state.financialRecords ?? [],
    regionalReputation: state.regionalReputation ?? {},
    logs: state.logs ?? [],
    arisMessages: [],
    alerts: state.alerts ?? [],
    tutorialFlags: state.tutorialFlags ?? {
      welcomed: true,
      firstDispatchCompleted: false,
      firstEventSeen: false
    },
    fleet: (state.fleet ?? []).map((ship) => ({
      ...ship,
      equipmentSlots: ship.equipmentSlots ?? [],
      flightExperience: ship.flightExperience ?? 0,
      task: ship.task ? { ...ship.task } : undefined
    })),
    availableContracts: (state.availableContracts ?? []).map(hydrateContract),
    activeContracts: (state.activeContracts ?? []).map(hydrateContract),
    completedContracts: (state.completedContracts ?? []).map(hydrateContract),
    failedContracts: (state.failedContracts ?? []).map(hydrateContract)
  };
}

function hydrateContract(contract: CompanyState["availableContracts"][number]) {
  return {
    ...contract,
    cargoType: contract.cargoType ?? "basic_supplies"
  };
}

function isLocalStorageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
