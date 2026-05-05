export const GameConfig = {
  WIDTH: 1400,
  HEIGHT: 700,
  STARTING_CREDITS: 100000,
  STARTING_REPUTATION: 50,
  MIN_SCALE: 0.5,
  MAX_SCALE: 4.0,
  ZOOM_STEP: 0.12,
  EDGE_PAN_MARGIN: 36,
  EDGE_PAN_SPEED: 520,
  EDGE_PAN_MIN_OFFSET_SCREEN_FRACTION: 0.18,
  DRAG_PAN_SPEED: 1,
  CAMERA_ROTATION_SPEED: 0.008,
  MIN_CAMERA_PITCH_DEG: 20,
  MAX_CAMERA_PITCH_DEG: 75,
  DEFAULT_CAMERA_PITCH_DEG: 45,
  BACKGROUND_STAR_COUNT: 340,
  BACKGROUND_IMAGE_ALPHA: 0.12,
  BACKGROUND_IMAGE_TINT: 0x545c6d,
  GLOW_STRENGTH: 1.15,
  LANE_ALPHA: 0.22,
  LANE_WIDTH: 1.1,
  HOVER_PICK_RADIUS: 18,
  FAST_RENDER_MIN_INTERVAL_MS: 33,
  DETAIL_RENDER_IDLE_MS: 140,
  MAX_AVAILABLE_CONTRACTS: 6,
  CONTRACT_REFERENCE_SPEED: 320,
  CONTRACT_REWARD_PER_DISTANCE: 1.7,
  CONTRACT_REWARD_PER_CARGO: 28,
  CONTRACT_PENALTY_PER_DISTANCE: 0.75,
  CONTRACT_TAX_PER_DISTANCE: 0.18,
  CONTRACT_LOGISTICS_BONUS_PER_CARGO: 8,
  LATE_DELIVERY_PENALTY_PER_DAY: 120,
  PIRATE_ATTACK_COST: 180,
  TRAVEL_EVENT_FACTOR: 0.36,
  MAX_DEBT_DAYS: 3,
  MAX_LOG_ENTRIES: 8,
  MAX_ARIS_MESSAGES: 4,
  MAX_COMPLETED_CONTRACTS: 10,
  MAX_FAILED_CONTRACTS: 10,
  TICK_INTERVAL_MS: 1800,
  IDLE_PORT_FEE: 18,
  PERISHABLE_LATE_PENALTY_PER_DAY: 190,
  FRAGILE_DAMAGE_PENALTY_MULTIPLIER: 0.35,
  ILLEGAL_SECURITY_EVENT_MULTIPLIER: 2.4,
  CREW_EXPERIENCE_GAIN_PER_DELIVERY: 8,
  CREW_MAX_WARP_FAILURE_REDUCTION: 0.22,
  REINFORCED_SHIELDS_DAMAGE_REDUCTION: 0.35,
  WARP_MK2_SPEED_BONUS: 0.18,
  CARGO_TYPES: {
    basic_supplies: {
      label: "Suprimentos Basicos",
      rewardMultiplier: 1.08,
      riskModifier: 0.02,
      preferredDestinationRegions: ["frontier"]
    },
    luxury_goods: {
      label: "Artigos de Luxo",
      rewardMultiplier: 1.22,
      riskModifier: 0.05,
      preferredDestinationRegions: ["core"]
    },
    perishables: {
      label: "Pereciveis",
      rewardMultiplier: 1.18,
      riskModifier: 0.03,
      preferredDestinationRegions: ["core", "rim"]
    },
    fragile: {
      label: "Frageis",
      rewardMultiplier: 1.15,
      riskModifier: 0.04,
      preferredDestinationRegions: ["veil", "core"]
    },
    illegal: {
      label: "Ilegais",
      rewardMultiplier: 1.85,
      riskModifier: 0.2,
      preferredDestinationRegions: ["core", "rim"]
    }
  },
  SHIP_CATALOG: [
    {
      id: "cinder-relay",
      name: "Cinder Relay",
      capacity: 24,
      speed: 300,
      maintenanceCost: 24,
      operatingCostPerDistance: 0.27,
      purchasePrice: 760,
      resaleValue: 430,
      equipmentSlots: []
    },
    {
      id: "mercury-spine",
      name: "Mercury Spine",
      capacity: 30,
      speed: 420,
      maintenanceCost: 38,
      operatingCostPerDistance: 0.32,
      purchasePrice: 1180,
      resaleValue: 690,
      equipmentSlots: [{ id: "warp_mk2", name: "Motores de Dobra Mk2" }]
    },
    {
      id: "astra-hauler",
      name: "Astra Hauler",
      capacity: 55,
      speed: 360,
      maintenanceCost: 45,
      operatingCostPerDistance: 0.35,
      purchasePrice: 1420,
      resaleValue: 840,
      equipmentSlots: [{ id: "reinforced_shields", name: "Escudos Reforcados" }]
    }
  ],
  STARTING_SHIPS: [
    {
      name: "Astra Hauler",
      capacity: 55,
      speed: 360,
      maintenanceCost: 45,
      operatingCostPerDistance: 0.35
    },
    {
      name: "Mercury Spine",
      capacity: 30,
      speed: 420,
      maintenanceCost: 38,
      operatingCostPerDistance: 0.32
    },
    {
      name: "Cinder Relay",
      capacity: 24,
      speed: 300,
      maintenanceCost: 24,
      operatingCostPerDistance: 0.27
    }
  ],
  EVENTS: {
    PIRATE_ATTACK_CHANCE: 0.15,
    ENGINE_FAILURE_CHANCE: 0.05,
    SAFE_ARRIVAL_BONUS: 50
  }
} as const;
