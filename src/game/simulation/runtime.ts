import { ArisMessage, CompanyState, LogEntry } from "../types/AstroTransit";
import { StarLookup } from "./starLookup";

export interface SimulationRuntimeDependencies {
  pushLog: (state: CompanyState, level: LogEntry["level"], message: string) => void;
  pushArisMessage: (state: CompanyState, category: ArisMessage["category"], message: string) => void;
  getStarName: (starLookup: StarLookup, starId: number) => string;
}

export interface SimulationLogDependencies {
  pushLog: (state: CompanyState, level: LogEntry["level"], message: string) => void;
  getStarName: (starLookup: StarLookup, starId: number) => string;
}

export function pushLog(state: CompanyState, level: LogEntry["level"], message: string) {
  state.logs.push({
    id: `log-${state.currentDay}-${state.logs.length}-${level}`,
    day: state.currentDay,
    level,
    message
  });
}

export function pushArisMessage(state: CompanyState, category: ArisMessage["category"], message: string) {
  state.arisMessages.push({
    id: `aris-${state.currentDay}-${state.arisMessages.length}-${category}`,
    day: state.currentDay,
    message,
    category
  });
}

export function getStarName(starLookup: StarLookup, starId: number) {
  return starLookup.getStar(starId)?.name ?? `Sistema ${starId}`;
}
