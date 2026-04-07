export type ShipStatus = "idle" | "traveling" | "damaged" | "stranded" | "maintenance";

export type ContractStatus = "available" | "active" | "completed" | "failed";

export type EventType = "pirates" | "warp_failure" | "logistics_crisis" | "safe_arrival";

export type LogLevel = "info" | "warn" | "error" | "success" | "aris";

export interface TravelTask {
  shipId: string;
  contractId: string;
  originStarId: number;
  destinationStarId: number;
  path: number[];
  totalDistance: number;
  remainingDays: number;
  totalEtaDays: number;
}

export interface Ship {
  id: string;
  name: string;
  currentStarId: number;
  status: ShipStatus;
  integrity: number;
  capacity: number;
  speed: number;
  maintenanceCost: number;
  operatingCostPerDistance: number;
  task?: TravelTask;
}

export interface Contract {
  id: string;
  title: string;
  originStarId: number;
  destinationStarId: number;
  originRegionId?: string;
  destinationRegionId?: string;
  cargoUnits: number;
  reward: number;
  penalty: number;
  risk: number;
  routeTax?: number;
  deadlineDay: number;
  status: ContractStatus;
  assignedShipId?: string;
  etaDays: number;
}

export interface GameEvent {
  id: string;
  day: number;
  type: EventType;
  severity: number;
  description: string;
  shipId?: string;
  contractId?: string;
}

export interface LogEntry {
  id: string;
  day: number;
  level: LogLevel;
  message: string;
}

export interface ArisMessage {
  id: string;
  day: number;
  message: string;
  category: "tutorial" | "status" | "alert";
}

export interface TutorialFlags {
  welcomed: boolean;
  firstDispatchCompleted: boolean;
  firstEventSeen: boolean;
}

export interface CompanyState {
  currentDay: number;
  currentTick: number;
  credits: number;
  reputation: number;
  debtDays: number;
  fleet: Ship[];
  availableContracts: Contract[];
  activeContracts: Contract[];
  completedContracts: Contract[];
  failedContracts: Contract[];
  logs: LogEntry[];
  arisMessages: ArisMessage[];
  tutorialFlags: TutorialFlags;
  alerts: string[];
  gameOver: boolean;
  gameOverReason?: string;
}
