// src/game/classes/Ship.ts
import { GameConfig } from '../utils/GameConfig';
import { Star } from './Universe';
import { Contract } from './Contract';
import { EventBus } from '../EventBus';

export type ShipStatus = 'IDLE' | 'TRAVELING' | 'MAINTENANCE' | 'CRITICAL_FAILURE' | 'REFUELING';
export type ShipType = keyof typeof GameConfig.SHIPS_DATA;

export class Ship {
    public id: string;
    public name: string;
    public type: ShipType;
    public maxFuel: number;
    public currentFuel: number;
    public speedMultiplier: number;
    public status: ShipStatus;
    public currentLocation: Star | null;
    public currentContract: Contract | null;

    constructor(id: string, type: ShipType, startingLocation: Star | null = null) {
        const shipData = GameConfig.SHIPS_DATA[type];

        this.id = id;
        this.type = type;
        this.name = shipData.name;
        this.maxFuel = shipData.maxFuel;
        this.currentFuel = shipData.maxFuel;
        this.speedMultiplier = shipData.speedMultiplier;
        this.status = 'IDLE';
        this.currentLocation = startingLocation;
        this.currentContract = null;
    }

    // public setSprite(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image) {
    //     this.sprite = sprite;
    // }

    public consumeFuel(amount: number = 1): void {
        this.currentFuel = Math.max(0, this.currentFuel - amount);

        if (this.currentFuel === 0 && this.status === 'TRAVELING') {
            this.status = 'CRITICAL_FAILURE';
            EventBus.emit('ship-fuel-critical', { shipId: this.id, shipName: this.name });
        }
    }

    public refuel(amount: number): void {
        this.currentFuel = Math.min(this.maxFuel, this.currentFuel + amount);
    }

    public assignContract(contract: Contract): void {
        this.currentContract = contract;
        this.status = 'TRAVELING';
    }

    public completeContract(): void {
        this.currentLocation = this.currentContract?.destination || this.currentLocation;
        this.currentContract = null;
        this.status = 'IDLE';
    }
}
