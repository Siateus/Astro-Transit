import { EventBus } from "../EventBus";
import { GameConfig } from "../utils/GameConfig";

export class TimeManager {
    public speed: number = 0;
    public day: number = 1;
    public tickAccumulator: number = 0;

    constructor() { }

    public setSpeed(newSpeed: number) {
        this.speed = newSpeed
        EventBus.emit('time-speed-changed', this.speed);
    }
    public togglePause() {
        this.speed = this.speed === 0 ? 1 : 0;
        EventBus.emit('time-speed-changed', this.speed);
    }
    public update(delta: number) {
        if (this.speed === 0) return;
        this.tickAccumulator += delta * this.speed;

        if (this.tickAccumulator >= GameConfig.TICK_RATE_MS) {
            this.tickAccumulator -= GameConfig.TICK_RATE_MS;
            this.day++;
            EventBus.emit('new-day', this.day);
        }
    }
}
