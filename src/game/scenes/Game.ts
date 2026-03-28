import { Scene, Math as PhaserMath, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { Universe, Star } from '../classes/Universe';
import { Starfield } from '../classes/Starfield';
import { TimeManager } from '../classes/TimeManager';
import { Contract } from '../classes/Contract';
import { EventGenerator } from '../classes/EventGenerator';
import { Company } from '../classes/Company';
import { Ship, ShipType } from '../classes/Ship';

export class Game extends Scene {
    private universe!: Universe;
    private timeManager!: TimeManager;
    private starfield!: Starfield;
    private selectionGraphics!: GameObjects.Graphics;
    private company!: Company;
    private shipSprites: Map<string, GameObjects.Sprite> = new Map();
    private shipTweens: Map<string, Phaser.Tweens.Tween> = new Map();

    constructor() {
        super('Game');
    }

    /**
     * Gets an existing ship sprite or creates a new one if it doesn't exist.
     * Sprites are never destroyed, only repositioned.
     */
    private getOrCreateShipSprite(shipId: string, startX: number, startY: number): GameObjects.Sprite {
        let sprite = this.shipSprites.get(shipId);
        if (!sprite) {
            sprite = this.add.sprite(startX, startY, 'ship').setScale(0.5);
            this.shipSprites.set(shipId, sprite);
        } else {
            sprite.setPosition(startX, startY);
        }
        return sprite;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x0b1d3a);
        this.cameras.main.centerOn(0, 0);

        this.universe = new Universe();
        const starData = this.cache.json.get('gaia_stars') as Star[];
        if (starData) {
            this.universe.loadSstarData(starData);
        }
        this.company = new Company('Astro-Transit', this.universe);
        this.timeManager = new TimeManager();

        this.starfield = new Starfield(this, this.universe);

        this.selectionGraphics = this.add.graphics();
        this.selectionGraphics.setDepth(10);

        this.setupInputs();

        EventBus.emit('current-scene-ready', this);
        
        // Passamos a company DIRETAMENTE nos dados de inicialização da Cena!
        this.scene.launch('UIScene', { company: this.company });

        EventBus.on('request-market', (shipId: string, location: Star) => {
            const ship = this.company.fleet.find(s => s.id === shipId);
            if (!ship) {
                EventBus.emit('log-event', 'Erro: Nave não encontrada!');
                return;
            }

            const validContracts: Contract[] = [];
            const maxAttempts = 15; // Try up to 15 times to get 3-5 valid contracts
            let attempts = 0;

            while (validContracts.length < 3 && attempts < maxAttempts) {
                const randomDestination = this.universe.getRandomStar();
                
                // Skip if destination is the same as origin
                if (randomDestination.source_id === location.source_id) {
                    attempts++;
                    continue;
                }

                const contract = new Contract(this.universe, location, randomDestination);
                
                // Only add if the contract has a valid path
                if (contract.status !== 'FAILED') {
                    validContracts.push(contract);
                }
                attempts++;
            }

            // If we got at least 3 contracts, extend to 4-5 if time permits
            while (validContracts.length < 5 && attempts < maxAttempts) {
                const randomDestination = this.universe.getRandomStar();
                if (randomDestination.source_id === location.source_id) {
                    attempts++;
                    continue;
                }
                const contract = new Contract(this.universe, location, randomDestination);
                if (contract.status !== 'FAILED') {
                    validContracts.push(contract);
                }
                attempts++;
            }

            if (validContracts.length === 0) {
                EventBus.emit('log-event', 'MERCADO: Nenhuma rota disponível nesta localização!');
                return;
            }

            // Emit the market data back to the UI
            EventBus.emit('market-data-ready', validContracts, shipId);
        });

        EventBus.on('request-buy-ship', (type: ShipType, price: number) => {
            // Get the capital system (star with ID 0, typically Terra)
            const spawnStar = this.universe.getStarById(0);
            if (spawnStar) {
                this.company.buyShip(type, price, spawnStar);
            } else {
                EventBus.emit('log-event', 'ERRO: Sistema de spawn não encontrado!');
            }
        });

        EventBus.on('analyze-contract', (shipId: string, destination: Star) => {
            const ship = this.company.fleet.find(s => s.id === shipId);
            if (!ship || !ship.currentLocation) {
                EventBus.emit('log-event', 'Erro: Nave ou localização inválida!');
                return;
            }
            const contract = new Contract(this.universe, ship.currentLocation, destination);
            EventBus.emit('contract-details', contract, shipId);
        });

        EventBus.on('contract-accepted', (contract: Contract, shipId: string) => {
            const ship = this.company.fleet.find(s => s.id === shipId);
            if (!ship || !ship.currentLocation) {
                EventBus.emit('log-event', 'Erro: Nave ou localização inválida!');
                return;
            }

            // Update business logic first
            ship.assignContract(contract);
            contract.status = 'ACCEPTED';

            // Get or create the sprite for this ship
            const startX = ship.currentLocation.x * this.starfield.scaleFactor;
            const startY = ship.currentLocation.y * this.starfield.scaleFactor;
            const sprite = this.getOrCreateShipSprite(shipId, startX, startY);

            // Start hop-by-hop travel along the calculated path
            this.travelAlongPath(ship, contract, sprite, 0);
        });

        EventBus.on('time-speed-changed', (speed: number) => {
            // Update all active ship tweens
            for (const tween of this.shipTweens.values()) {
                if (speed === 0) {
                    tween.pause();
                } else {
                    tween.resume();
                    tween.timeScale = speed;
                }
            }
        });

        EventBus.on('daily-event-check', () => {
            EventGenerator.generateRandomEvent();
        });

        EventBus.on('buy-fuel', (data: { shipId: string; amount: number }) => {
            this.company.buyFuel(data.shipId, data.amount);
        });
        EventBus.on('ship-fuel-critical', (data: { shipId: string, shipName: string }) => {
            EventBus.emit('log-event', `EMERGÊNCIA: ${data.shipName} ficou sem combustível e está à deriva!`);
            // If there's an active journey for this ship, pause it and mark as critical
            const tween = this.shipTweens.get(data.shipId);
            if (tween) {
                tween.pause();
                const sprite = this.shipSprites.get(data.shipId);
                if (sprite) {
                    sprite.setTint(0xff0000); // Turns red to indicate danger
                }
            }
        });
    }

    /**
     * Recursively travels along the contract path, one hop at a time.
     * Each hop is a separate tween from one star to the next.
     * Duration is calculated based on actual distance and ship speed.
     */
    private travelAlongPath(ship: Ship, contract: Contract, sprite: GameObjects.Sprite, hopIndex: number): void {
        // Check if we've reached the end of the path
        if (hopIndex >= contract.path.length - 1) {
            // All hops completed, finalize the contract
            ship.completeContract();
            contract.status = 'COMPLETED';
            this.company.addCredits(contract.reward);
            EventBus.emit('log-event', `✓ Entrega concluída! +¢${contract.reward.toLocaleString()}`);
            
            // Sprite stays at the final destination (NOT destroyed)
            this.shipTweens.delete(ship.id);
            return;
        }

        const currentStar = contract.path[hopIndex];
        const nextStar = contract.path[hopIndex + 1];

        // Calculate distance for this single hop
        const jumpDistance = this.universe.calculateDistance(currentStar, nextStar);

        // Realistic duration: hopDistance * (base speed / ship's speedMultiplier)
        // Adjust base multiplier to control travel speed visually
        const duration = (jumpDistance * 100) / ship.speedMultiplier;

        // Convert world coordinates for the next star
        const destX = nextStar.x * this.starfield.scaleFactor;
        const destY = nextStar.y * this.starfield.scaleFactor;

        // Create a tween for this single hop
        const tween = this.tweens.add({
            targets: sprite,
            x: destX,
            y: destY,
            duration: duration,
            onComplete: () => {
                // Update ship's location to the new star
                ship.currentLocation = nextStar;
                
                // Remove this tween and recursively continue to next hop
                this.shipTweens.delete(ship.id);
                this.travelAlongPath(ship, contract, sprite, hopIndex + 1);
            }
        });

        // Apply time scale from TimeManager
        tween.timeScale = this.timeManager.speed;
        if (this.timeManager.speed === 0) {
            tween.pause();
        }

        // Store tween reference for potential pause/resume operations
        this.shipTweens.set(ship.id, tween);
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
        this.timeManager.update(delta, this.company);
    }
}
