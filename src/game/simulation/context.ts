import { CompanyState, LogEntry, ArisMessage } from "../types/AstroTransit";
import { Star } from "../types/MapData";
import { NavigationLookup } from "./navigationLookup";
import { RegionLookup } from "./regionLookup";
import { StarLookup } from "./starLookup";

export interface SimulationContext {
  state: CompanyState;
  stars: Star[];
  starLookup: StarLookup;
  navigation: NavigationLookup;
  regionLookup?: RegionLookup;
}

export interface SimulationLogContext extends SimulationContext {
  pushLog: (state: CompanyState, level: LogEntry["level"], message: string) => void;
  getStarName: (starLookup: StarLookup, starId: number) => string;
}

export interface SimulationRuntimeContext extends SimulationContext {
  pushLog: (state: CompanyState, level: LogEntry["level"], message: string) => void;
  pushArisMessage: (state: CompanyState, category: ArisMessage["category"], message: string) => void;
  getStarName: (starLookup: StarLookup, starId: number) => string;
}
