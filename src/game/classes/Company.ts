import { EventBus } from "../EventBus";
import { GameConfig } from "../utils/GameConfig";
import { Ship } from "./Ship"


export class Company {
    public name: string;
    public credits: number;
    public reputation: number;
    public fleet: Ship[];

    constructor(name: string) {
        this.name = name;
        this.credits = GameConfig.STARTING_CREDITS;
        this.credits = GameConfig.STARTING_REPUTANTION;
        this.fleet = [];
    }
    public addCredits(amount: number) {
        this.credits += amount;
        EventBus.emit('update-credits', this.credits);
    }

    public payMaintenance() {
        if (this.credits >= GameConfig.SHIP_MAINTENANCE_COST) {
            this.credits -= GameConfig.SHIP_MAINTENANCE_COST;
            EventBus.emit('update-credits', this.credits);
        } else {
            EventBus.emit('log-event', "ALERTA: Fundos insuficientes para manutenção!");
        }
    }

    public buyFuel(amount: number) {
        const totalCost = amount * GameConfig.FUEL_COST_PER_UNIT;
        if (this.credits >= totalCost) {
            this.credits -= totalCost;
            EventBus.emit('update-credits', this.credits);
        } else {
            EventBus.emit('log-event', "ALERTA: Fundos insuficientes para o combustível!");
        }
    }
}
