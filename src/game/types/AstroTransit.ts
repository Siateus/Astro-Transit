export type ShipStatus = "idle" | "traveling" | "damaged" | "stranded" | "maintenance";

export type ContractStatus = "available" | "active" | "completed" | "failed";

export type EventType = "pirates" | "warp_failure" | "logistics_crisis" | "police_interception" | "safe_arrival";

export type LogLevel = "info" | "warn" | "error" | "success" | "aris";

export type CargoType = "basic_supplies" | "luxury_goods" | "perishables" | "fragile" | "illegal";

export type EquipmentModuleId = "reinforced_shields" | "warp_mk2";

export interface ShipEquipmentModule {
  id: EquipmentModuleId;
  name: string;
}

export interface TravelTask {
  shipId: string;
  contractId: string;
  originStarId: number;
  destinationStarId: number;
  path: number[];
  totalDistance: number;
  remainingDistance: number;
  remainingDays: number;
  totalEtaDays: number;
}

export interface Ship {
  id: string;
  typeId?: string;
  name: string;
  currentStarId: number;
  status: ShipStatus;
  integrity: number;
  capacity: number;
  speed: number;
  maintenanceCost: number;
  operatingCostPerDistance: number;
  purchasePrice?: number;
  resaleValue?: number;
  equipmentSlots: ShipEquipmentModule[];
  flightExperience: number;
  maintenanceDaysRemaining?: number;
  task?: TravelTask;
}

export interface Contract {
  id: string;
  title: string;
  originStarId: number;
  destinationStarId: number;
  originRegionId?: string;
  destinationRegionId?: string;
  cargoType: CargoType;
  cargoUnits: number;
  reward: number;
  penalty: number;
  risk: number;
  routeRisk?: number;
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

export interface FinancialRecord {
  id: string;
  day: number;
  type: "income" | "expense";
  amount: number;
  shipId?: string;
  regionId?: string;
  description: string;
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
  diasNoVermelho: number;
  fleet: Ship[];
  availableContracts: Contract[];
  activeContracts: Contract[];
  completedContracts: Contract[];
  failedContracts: Contract[];
  regionalReputation: Record<string, number>;
  logs: LogEntry[];
  financialRecords: FinancialRecord[];
  arisMessages: ArisMessage[];
  tutorialFlags: TutorialFlags;
  alerts: string[];
  gameOver: boolean;
  fimDeJogo: boolean;
  gameOverReason?: string;
}
