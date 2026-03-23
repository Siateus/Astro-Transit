
export const GameConfig = {

    STARTING_CREDITS: 1000,
    STARTING_REPUTANTION: 50,

    FUEL_COST_PER_UNIT: 5,
    SHIP_MAINTENANCE_COST: 100,

    TICK_RATE_MS: 1000,
    BASE_SHIP_SPEED: 10,

    EVENTS: {
        PIRATE_ATTACK_CHANCE: 0.15,
        ENGINE_FAILURE_CHANCE: 0.05,
        SAFE_ARRIVAL_BONUS: 50
    },

    SHIPS_DATA: {
        BASIC_CARGO: {
            name: "Cargueiro Básico",
            price: 500,
            maxFuel: 100,
            speedMultiplier: 1.0
        },
        ADVANCED_FIGATE: {
            name: "Fragate Avançada",
            price: 2500,
            maxFuel: 300,
            speedMultiplier: 1.5
        }
    }
};
