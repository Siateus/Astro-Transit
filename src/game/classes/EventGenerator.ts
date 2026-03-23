import { EventBus } from "../EventBus";
import { GameConfig } from "../utils/GameConfig";
import { Ship } from "./Ship";

export class EventGenerator {
    public static checkDailyEvents(ship: Ship) {
        if (ship.status !== "TRAVELING") return;

        const roll = Math.random();

        if (roll < GameConfig.EVENTS.ENGINE_FAILURE_CHANCE) {
            ship.status = 'CRITICAL_FAILURE';
            EventBus.emit('log-event', `CRÍTICO: Falha no motor da nave ${ship.name}!`);
            EventBus.emit('pause-game');
            return;
        }
        if (roll < GameConfig.EVENTS.PIRATE_ATTACK_CHANCE) {
            EventBus.emit('log-event', `ALERTA: A nave ${ship.name} sofreu uma tentativa de saque pirata!`);
            EventBus.emit('pause-game');
            return;
        }
    }
}
