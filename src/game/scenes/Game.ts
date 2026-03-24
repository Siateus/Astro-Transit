import { Scene, Math as PhaserMath, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { Universe, Star } from '../classes/Universe';
import { Starfield } from '../classes/Starfield';
import { TimeManager } from '../classes/TimeManager';

export class Game extends Scene {
    private universe!: Universe;
    private timeManager!: TimeManager;
    private starfield!: Starfield;
    private selectionGraphics!: GameObjects.Graphics;

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x0b1d3a);
        this.cameras.main.centerOn(0, 0);

        this.universe = new Universe();
        const starData = this.cache.json.get('gaia_stars') as Star[];
        if (starData) {
            this.universe.loadSstarData(starData);
        }
        this.timeManager = new TimeManager();

        this.starfield = new Starfield(this, this.universe);

        this.selectionGraphics = this.add.graphics();
        this.selectionGraphics.setDepth(10);

        this.setupInputs();

        EventBus.emit('current-scene-ready', this);

        this.scene.launch('UIScene');
    }

    private setupInputs() {
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoomMultiplier = deltaY > 0 ? 0.9 : 1.1;
            let newZoom = this.cameras.main.zoom * zoomMultiplier;
            this.cameras.main.zoom = PhaserMath.Clamp(newZoom, 0.1, 5);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const clickX = pointer.worldX;
            const clickY = pointer.worldY;

            let closestStar: Star | null = null;
            let minDistance = 10 / this.cameras.main.zoom;

            for (const star of this.universe.stars) {

                const worldX = star.x * this.starfield.scaleFactor;

                const worldY = star.y * this.starfield.scaleFactor;

                const dist = PhaserMath.Distance.Between(clickX, clickY, worldX, worldY);



                if (dist < minDistance) {

                    minDistance = dist;

                    closestStar = star;
                }

            }

            this.selectionGraphics.clear();
            if (closestStar) {
                const targetX = closestStar.x * this.starfield.scaleFactor;
                const targetY = closestStar.y * this.starfield.scaleFactor;

                this.selectionGraphics.lineStyle(2 / this.cameras.main.zoom, 0x39c0f9, 1);
                this.selectionGraphics.strokeCircle(targetX, targetY, 8 / this.cameras.main.zoom);

                EventBus.emit('star-selected', closestStar);

            } else {
                EventBus.emit('star-selected', null);
            }
        });
    }
    update(time: number, delta: number): void {
        this.timeManager.update(delta);
    }
}
