import { EventBus } from "../EventBus";
import { GameConfig } from "../utils/GameConfig";
import { Company } from "./Company";
import { EventGenerator } from "./EventGenerator";

export class TimeManager {
    public speed: number = 0;
    public day: number = 1;
    public tickAccumulator: number = 0;
    private daysSinceLastMaintenance: number = 0;
    private daysSinceLastEventCheck: number = 0;

    constructor() {
        EventBus.on('time-play', () => this.setSpeed(1));
        EventBus.on('time-pause', () => this.setSpeed(0));
        EventBus.on('time-fastforward', () => this.setSpeed(2));
    }

    public setSpeed(newSpeed: number) {
        this.speed = newSpeed
        EventBus.emit('time-speed-changed', this.speed);
    }
    public togglePause() {
        this.speed = this.speed === 0 ? 1 : 0;
        EventBus.emit('time-speed-changed', this.speed);
    }
    public update(delta: number, company?: Company) {
        if (this.speed === 0) return;
        this.tickAccumulator += delta * this.speed;

        if (this.tickAccumulator >= GameConfig.TICK_RATE_MS) {
            this.tickAccumulator -= GameConfig.TICK_RATE_MS;
            this.day++;
            this.daysSinceLastMaintenance++;
            this.daysSinceLastEventCheck++;

            EventBus.emit('update-day', this.day);

            // Process daily fleet logic if company is provided
            if (company) {
                this.processDailyTick(company);
            }

            if (this.daysSinceLastMaintenance >= GameConfig.MAINTENANCE_INTERVAL_DAYS) {
                EventBus.emit('maintenance-due');
                this.daysSinceLastMaintenance = 0;
            }

            if (this.daysSinceLastEventCheck >= GameConfig.EVENT_CHECK_INTERVAL_DAYS) {
                EventBus.emit('daily-event-check');
                this.daysSinceLastEventCheck = 0;
            }
        }
    }

    public processDailyTick(company: Company): void {
        // Process each ship in the fleet
        for (const ship of company.fleet) {
            if (ship.status === 'TRAVELING' && ship.currentContract) {
                // Gradually consume fuel during travel (1 unit per day)
                ship.consumeFuel(1);

                // Check for daily events
                EventGenerator.checkDailyEvents(ship, company);
            }
        }
    }
}
