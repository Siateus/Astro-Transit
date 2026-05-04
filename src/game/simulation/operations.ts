import { CompanyState, LogEntry } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";

export interface OperationsDependencies {
  pushLog: (state: CompanyState, level: LogEntry["level"], message: string) => void;
}

export function applyMaintenanceCosts(state: CompanyState, dependencies: OperationsDependencies) {
  let maintenance = 0;
  let idlePortFees = 0;
  let idleShips = 0;

  state.fleet.forEach((ship) => {
    maintenance += ship.maintenanceCost;

    if (ship.status === "idle") {
      idleShips += 1;
      idlePortFees += GameConfig.IDLE_PORT_FEE;
    }
  });

  const fixedCosts = maintenance + idlePortFees;
  state.credits -= fixedCosts;
  dependencies.pushLog(
    state,
    "info",
    `Gastos fixos do dia: ${fixedCosts} créditos (${maintenance} manutenção + ${idlePortFees} estadia em porto / ${idleShips} naves ociosas).`
  );
}

export function resolveActiveMaintenance(state: CompanyState, dependencies: OperationsDependencies) {
  state.fleet.forEach((ship) => {
    if (ship.status !== "maintenance") {
      return;
    }

    ship.maintenanceDaysRemaining = Math.max(0, (ship.maintenanceDaysRemaining ?? 1) - 1);
    if (ship.maintenanceDaysRemaining > 0) {
      return;
    }

    ship.integrity = 100;
    ship.status = "idle";
    ship.maintenanceDaysRemaining = undefined;
    dependencies.pushLog(state, "success", `${ship.name} saiu da manutenção com integridade restaurada.`);
  });
}

export function resolveDebt(state: CompanyState, dependencies: OperationsDependencies) {
  if (state.credits < 0) {
    const diasNoVermelho = (state.diasNoVermelho ?? state.debtDays) + 1;
    state.diasNoVermelho = diasNoVermelho;
    state.debtDays = diasNoVermelho;
    state.alerts.push(`ALERTA FINANCEIRO: empresa no vermelho há ${diasNoVermelho} dias.`);

    if (diasNoVermelho >= GameConfig.MAX_DEBT_DAYS) {
      state.fimDeJogo = true;
      state.gameOver = true;
      state.gameOverReason = "Falência operacional: a empresa permaneceu endividada por tempo demais.";
      dependencies.pushLog(state, "error", state.gameOverReason);
    }
    return;
  }

  state.diasNoVermelho = 0;
  state.debtDays = 0;
}
