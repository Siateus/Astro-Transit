
export const GameConfig = {

    WIDTH: 1200,
    HEIGHT: 700,

    STARTING_CREDITS: 10000000,
    STARTING_REPUTATION: 50,

    FUEL_COST_PER_UNIT: 5,
    SHIP_MAINTENANCE_COST: 100,

    TICK_RATE_MS: 1000,
    BASE_SHIP_SPEED: 10,
    MAX_DAYS: 1000,

    MAINTENANCE_INTERVAL_DAYS: 10,
    EVENT_CHECK_INTERVAL_DAYS: 3,

    MIN_SCALE: 0.5,
    MAX_SCALE: 4.0,
    SCALE_FACTOR: 1.5,
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
    GALAXY_CLOUD_COUNT: 190,
    DUST_CLOUD_COUNT: 85,
    GLOW_STRENGTH: 1.15,
    LANE_ALPHA: 0.22,
    LANE_WIDTH: 1.1,
    TERRITORY_PADDING: 34,
    TERRITORY_ALPHA: 0.16,
    MOCK_EMPIRE_COUNT: 5,
    LABEL_ZOOM_DISTANT: 0.85,
    LABEL_ZOOM_MID: 1.4,
    LABEL_ZOOM_CLOSE: 2.15,
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
    STARTING_SHIPS: [
        {
            name: "Astra Hauler",
            capacity: 40,
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
            capacity: 55,
            speed: 300,
            maintenanceCost: 52,
            operatingCostPerDistance: 0.4
        }
    ],

    FOG_OF_WAR_ENABLED: false,


    EVENTS: {
        PIRATE_ATTACK_CHANCE: 0.15,
        ENGINE_FAILURE_CHANCE: 0.05,
        SAFE_ARRIVAL_BONUS: 50
    },

    SHIPS_DATA: {
        BASIC_CARGO: {
            name: "Cargueiro Básico",
            price: 5000,
            maxFuel: 2000,
            speedMultiplier: 1.0
        },
        ADVANCED_FRIGATE: {
            name: "Fragata Avançada",
            price: 8000,
            maxFuel: 5000,
            speedMultiplier: 1.5
        }
    },

    ASSETS: {
        IMAGES: {
            SHIP_DEFAULT: 'ship',
            STAR_DOT: 'dot',
            TOPBAR: 'panel_title_01',
            ICON_PLAY: 'icon_play',
            ICON_PAUSE: 'icon_pause',
            ICON_FF: 'icon_ff'
        }
    }
};
