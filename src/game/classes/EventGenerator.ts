import { EventBus } from "../EventBus";
import { Ship } from "./Ship";
import { Company } from "./Company";

export interface EventChoice {
    label: string;
    action: () => void;
}

export interface InteractiveEvent {
    title: string;
    description: string;
    choices: EventChoice[];
}

export class EventGenerator {
    public static checkDailyEvents(ship: Ship, company: Company): void {
        if (ship.status !== 'TRAVELING' || !ship.currentContract) return;

        // O risco de pirataria agora é real, baseado no nó onde a nave está/vai
        const nodeRisk = ship.currentLocation?.piracyRisk ?? 0.1;
        
        // Rola o dado contra o risco do sistema
        if (Math.random() < (nodeRisk / 10)) { // Dividido por 10 para não acontecer todos os dias
            this.triggerPirateEncounter(ship, company);
            return;
        }

        // Evento aleatório de Tempestade (2% de chance global)
        if (Math.random() < 0.02) {
            this.triggerSolarFlare(ship);
        }
    }

    private static triggerPirateEncounter(ship: Ship, company: Company): void {
        EventBus.emit('time-pause'); // Pausa o jogo imediatamente
        
        const bribeCost = Math.floor((ship.currentContract?.reward || 1000) * 0.3);

        const eventData: InteractiveEvent = {
            title: "⚠ INTERCEPTAÇÃO PIRATA!",
            description: `A nave ${ship.name} foi emboscada por piratas no setor ${ship.currentLocation?.source_id}.\nEles exigem um pedágio de ¢${bribeCost} para deixarem a carga passar.`,
            choices: [
                {
                    label: `Pagar ¢${bribeCost}`,
                    action: () => {
                        if (company.credits >= bribeCost) {
                            company.credits -= bribeCost;
                            EventBus.emit('update-credits', company.credits);
                            EventBus.emit('log-event', `Você pagou o suborno de ¢${bribeCost}. A viagem prossegue.`);
                        } else {
                            EventBus.emit('log-event', `Sem créditos para o suborno! Os piratas saquearam a nave.`);
                            // Penalidade severa por não ter dinheiro
                            company.credits = Math.max(0, company.credits - bribeCost);
                            EventBus.emit('update-credits', company.credits);
                        }
                    }
                },
                {
                    label: `Tentar Fuga (Baseado na Velocidade)`,
                    action: () => {
                        const escapeChance = 0.4 * ship.speedMultiplier; // Naves rápidas têm mais chance
                        if (Math.random() < escapeChance) {
                            EventBus.emit('log-event', `SUCESSO! A ${ship.name} escapou ilesa dos piratas!`);
                        } else {
                            const damage = bribeCost * 2; // Punição dupla se falhar
                            company.credits = Math.max(0, company.credits - damage);
                            EventBus.emit('update-credits', company.credits);
                            EventBus.emit('log-event', `FALHA! A nave sofreu danos severos tentando fugir. ¢-${damage}.`);
                        }
                    }
                }
            ]
        };

        EventBus.emit('trigger-interactive-event', eventData);
    }

    private static triggerSolarFlare(ship: Ship): void {
        EventBus.emit('time-pause');
        
        const eventData: InteractiveEvent = {
            title: "☀ TEMPESTADE SOLAR",
            description: `Uma forte erupção solar atingiu os escudos da ${ship.name}. A navegação principal caiu.`,
            choices: [
                {
                    label: `Gastar 5u de Combustível extra para desviar`,
                    action: () => {
                        ship.consumeFuel(5);
                        EventBus.emit('log-event', `A ${ship.name} fez um desvio seguro, gastando mais combustível.`);
                    }
                },
                {
                    label: `Atravessar a tempestade (Risco de atraso)`,
                    action: () => {
                        EventBus.emit('log-event', `A ${ship.name} enfrentou a tempestade, danificando os motores levemente.`);
                        // Futuramente afeta a velocidade da nave ou o prazo de entrega
                    }
                }
            ]
        };
        EventBus.emit('trigger-interactive-event', eventData);
    }
}
