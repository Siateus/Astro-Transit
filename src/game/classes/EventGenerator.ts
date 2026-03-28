import { EventBus } from "../EventBus";
import { GameConfig } from "../utils/GameConfig";
import { Ship } from "./Ship";
import { Company } from "./Company";

export class EventGenerator {
    private static readonly EVENTS = [
        { type: 'PIRATE_ATTACK', chance: 0.15, consequence: 'financial' },
        { type: 'FUEL_SHORTAGE', chance: 0.08, consequence: 'fuel' },
        { type: 'SOLAR_FLARE', chance: 0.10, consequence: 'delay' },
        { type: 'SAFE_JOURNEY', chance: 0.05, consequence: 'bonus' }
    ];

    public static checkDailyEvents(ship: Ship, company: Company): void {
        if (ship.status !== 'TRAVELING' || !ship.currentContract) return;

        // Each event has a chance to occur
        for (const event of this.EVENTS) {
            const roll = Math.random();
            if (roll <= event.chance) {
                this.executeEvent(event.type, ship, company);
                return; // Only one event per day
            }
        }
    }

    private static executeEvent(eventType: string, ship: Ship, company: Company): void {
        switch (eventType) {
            case 'PIRATE_ATTACK':
                this.handlePirateAttack(ship, company);
                break;
            case 'FUEL_SHORTAGE':
                this.handleFuelShortage(ship, company);
                break;
            case 'SOLAR_FLARE':
                this.handleSolarFlare(ship, company);
                break;
            case 'SAFE_JOURNEY':
                this.handleSafeJourney(ship, company);
                break;
        }
    }

    private static handlePirateAttack(ship: Ship, company: Company): void {
        const lossAmount = Math.floor(ship.currentContract!.reward * 0.3);
        company.credits -= lossAmount;
        EventBus.emit('log-event', `CRÍTICO: ${ship.name} sofreu ataque pirata! ¢-${lossAmount} perdidos.`);
        EventBus.emit('update-credits', company.credits);
    }

    private static handleFuelShortage(ship: Ship, company: Company): void {
        const extraCost = Math.floor(100 * (1 + Math.random()));
        if (company.credits >= extraCost) {
            company.credits -= extraCost;
            EventBus.emit('log-event', `AVISO: Preços de combustível subiram. ¢-${extraCost} gasto em rota.`);
            EventBus.emit('update-credits', company.credits);
        } else {
            EventBus.emit('log-event', `CRÍTICO: Sem créditos para combustível de emergência!`);
        }
    }

    private static handleSolarFlare(ship: Ship, company: Company): void {
        // Delay effect: added fuel consumption
        ship.consumeFuel(2);
        EventBus.emit('log-event', `ALERTA: Tempestade solar força desvio. ${ship.name} consome 2 unidades extras.`);
    }

    private static handleSafeJourney(ship: Ship, company: Company): void {
        const bonus = Math.floor(ship.currentContract!.reward * 0.1);
        company.addCredits(bonus);
        EventBus.emit('log-event', `SUCESSO: Rota segura! Bônus: ¢+${bonus}.`);
    }

    public static generateRandomEvent(): void {
        const chance = Math.random();
        if (chance > 0.3) return; // 30% chance

        const randomEvent = this.EVENTS[Math.floor(Math.random() * this.EVENTS.length)];
        EventBus.emit('log-event', `Evento aleatório: ${randomEvent.type}`);
    }
}
