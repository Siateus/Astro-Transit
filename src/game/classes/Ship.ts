// src/game/classes/Ship.ts
import { GameConfig } from '../utils/GameConfig';

export type ShipStatus = 'IDLE' | 'TRAVELING' | 'MAINTENANCE' | 'CRITICAL_FAILURE';
export type ShipType = keyof typeof GameConfig.SHIPS_DATA;

export class Ship {
    public id: string;
    public name: string;
    public type: ShipType;
    public maxFuel: number;
    public currentFuel: number;
    public speedMultiplier: number;
    public status: ShipStatus;

    constructor(id: string, type: ShipType) {
        const shipData = GameConfig.SHIPS_DATA[type];

        this.id = id;
        this.type = type;
        this.name = shipData.name;
        this.maxFuel = shipData.maxFuel;
        this.currentFuel = shipData.maxFuel;
        this.speedMultiplier = shipData.speedMultiplier;
        this.status = 'IDLE';
    }

    // public setSprite(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image) {
    //     this.sprite = sprite;
    // }

    public consumeFuel(distance: number) {

        const consumed = distance * GameConfig.FUEL_COST_PER_UNIT;
        this.currentFuel = Math.max(0, this.currentFuel - consumed);

        if (this.currentFuel === 0) {
            this.status = 'CRITICAL_FAILURE';
        }
    }
}
