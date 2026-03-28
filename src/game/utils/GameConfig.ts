
export const GameConfig = {

    WIDTH: 1200,
    HEIGHT: 700,

    STARTING_CREDITS: 10000000,
    STARTING_REPUTANTION: 50,

    FUEL_COST_PER_UNIT: 5,
    SHIP_MAINTENANCE_COST: 100,

    TICK_RATE_MS: 1000,
    BASE_SHIP_SPEED: 10,

    MAINTENANCE_INTERVAL_DAYS: 10,
    EVENT_CHECK_INTERVAL_DAYS: 3,

    MIN_SCALE: 0.5,
    MAX_SCALE: 4.0,
    SCALE_FACTOR: 3,


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
    }
};
