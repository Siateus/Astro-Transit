import { EventBus } from "../EventBus";
import { GameConfig } from "../utils/GameConfig";
import { Ship, ShipType } from "./Ship"
import { Contract } from "./Contract"
import { Universe, Star } from "./Universe";


export class Company {
    public name: string;
    public credits: number;
    public reputation: number;
    public fleet: Ship[];

    constructor(name: string, universe: Universe) {
        this.name = name;
        this.credits = GameConfig.STARTING_CREDITS;
        this.reputation = GameConfig.STARTING_REPUTANTION;
        this.fleet = [];

        // Instanciar nave inicial na Terra (primeira estrela if available)
        const earthLocation = universe.stars.length > 0 ? universe.stars[0] : null;
        const initialShip = new Ship('SHIP-001', 'BASIC_CARGO', earthLocation);
        this.fleet.push(initialShip);

        EventBus.on('maintenance-due', () => {
            this.payMaintenance();
        });
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

    public buyFuel(shipId: string, amount: number): boolean {
        const ship = this.fleet.find(s => s.id === shipId);
        if (!ship) {
            EventBus.emit('log-event', "ERRO: Nave não encontrada!");
            return false;
        }

        const totalCost = amount * GameConfig.FUEL_COST_PER_UNIT;
        if (this.credits >= totalCost) {
            this.credits -= totalCost;
            ship.refuel(amount);
            EventBus.emit('update-credits', this.credits);
            EventBus.emit('log-event', `Nave ${ship.name} reabastecida com ${amount} unidades.`);
            return true;
        } else {
            EventBus.emit('log-event', "ALERTA: Fundos insuficientes para o combustível!");
            return false;
        }
    }

    public buyShip(type: ShipType, price: number, spawnLocation: Star): boolean {
        // Check if company has enough credits
        if (this.credits < price) {
            EventBus.emit('log-event', `ERRO: Fundos insuficientes! Precisa de ¢${price} mas tem ¢${this.credits}.`);
            return false;
        }

        // Deduct the price from credits
        this.credits -= price;
        EventBus.emit('update-credits', this.credits);

        // Generate new ship ID based on fleet size
        const newId = `SHIP-00${this.fleet.length + 1}`;

        // Instantiate the new ship at the spawn location
        const newShip = new Ship(newId, type, spawnLocation);

        // Add to fleet
        this.fleet.push(newShip);

        // Emit UI update event
        EventBus.emit('fleet-updated');

        // Emit success log
        EventBus.emit('log-event', `✓ Nova nave adquirida: ${newShip.name} (${newId}) - ancorada em Terra!`);

        return true;
    }
}
