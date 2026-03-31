import { Scene, Math as PhaserMath, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { Universe, Star, projectStar } from '../classes/Universe';
import { Starfield } from '../classes/Starfield';
import { TimeManager } from '../classes/TimeManager';
import { Contract } from '../classes/Contract';
import { EventGenerator } from '../classes/EventGenerator';
import { Company } from '../classes/Company';
import { Ship, ShipType } from '../classes/Ship';
import { UIStyle } from '../ui/UIStyle';
import { GameConfig } from '../utils/GameConfig';

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
        this.cameras.main.setBackgroundColor(UIStyle.PALETTE.BACKGROUND_DEEP_SPACE);
        this.cameras.main.centerOn(0, 0);

        this.universe = new Universe();
        const starData = this.cache.json.get('gaia_stars') as Star[];
        if (starData) {
            this.universe.loadSstarData(starData);
        }
        this.company = new Company('Astro-Transit', this.universe);
        this.timeManager = new TimeManager();

        // Fundo cosmético é apenas preto escuro + nebulosas procedurais do Starfield
        this.starfield = new Starfield(this, this.universe);

        // Fase 4: Setup camera listeners para atualizar labels
        this.starfield.setupCameraListeners();

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

            // Get or create the sprite for this ship using projected coordinates
            const { x: startX, y: startY } = projectStar(ship.currentLocation, this.starfield.scaleFactor);
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
            // Daily events são procesados em EventGenerator.checkDailyEvents()
            // que é chamado automaticamente em TimeManager.processDailyTick()
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
                    sprite.setTint(UIStyle.PALETTE.ERROR.bg); // Turns red to indicate danger
                }
            }
        });

        EventBus.on('daily-ai-tick', () => {
            this.universe.competitors.forEach(comp => {
                // 5% de chance diária de a IA agir
                if (Math.random() < 0.05) {
                    const earned = Math.floor(Math.random() * 2000) + 500;
                    comp.credits += earned;
                    comp.reputation += Math.floor(Math.random() * 3);
                    
                    // IA tenta dominar um sistema aleatório (preferencialmente explorado para dar dinamismo visível ao jogador)
                    const exploredStars = this.universe.stars.filter(s => s.isExplored);
                    if (exploredStars.length > 0) {
                        const targetStar = exploredStars[Math.floor(Math.random() * exploredStars.length)];
                        
                        // Ignora o sistema Capital (ID 0) para o jogador não perder a Terra
                        if (targetStar.source_id !== 0) {
                            if (targetStar.owner === 'PLAYER') {
                                // IA ataca o território do jogador
                                targetStar.influence = Math.max(0, (targetStar.influence || 100) - 25);
                                if (targetStar.influence <= 0) {
                                    targetStar.owner = comp.name; // IA rouba o sistema
                                    EventBus.emit('log-event', `⚠ ALERTA CRÍTICO: ${comp.name} destruiu o nosso monopólio no Sistema ${targetStar.source_id}!`);
                                    this.updateFogOfWar(); // Atualiza a cor do mapa
                                }
                            } else if (targetStar.owner !== comp.name) {
                                // IA domina sistemas neutros ou de outras IAs
                                targetStar.influence = (targetStar.influence || 0) + 25;
                                if (targetStar.influence >= 100) {
                                    targetStar.influence = 100;
                                    targetStar.owner = comp.name;
                                    this.updateFogOfWar();
                                }
                            }
                        }
                    }

                    // Notícia de mega-contrato
                    if (earned > 2500) {
                        EventBus.emit('log-event', `NOTÍCIA: ${comp.name} expande operações com lucro de ¢${earned}.`);
                    }
                }
            });
        });
        // Calcula e envia o Ranking quando a UI pedir
        EventBus.on('request-ranking', () => {
            const rankingData = [
                { name: this.company.name, rep: this.company.reputation, cred: this.company.credits, isPlayer: true },
                ...this.universe.competitors.map(c => ({ name: c.name, rep: c.reputation, cred: c.credits, isPlayer: false }))
            ];
            
            // Ordena por Reputação (Maior para o Menor)
            rankingData.sort((a, b) => b.rep - a.rep);
            EventBus.emit('receive-ranking', rankingData);
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
            
            // Ganhar influência no sistema de destino
            const destStar = contract.destination;
            if (destStar.owner !== 'PLAYER') {
                destStar.influence = (destStar.influence || 0) + 25; // Precisa de 4 entregas para dominar
                
                if (destStar.influence >= 100) {
                    destStar.influence = 100;
                    destStar.owner = 'PLAYER';
                    EventBus.emit('log-event', `SUCESSO: A sua empresa estabeleceu um Monopólio no Sistema ${destStar.source_id}!`);
                }
            }
            
            // Atualiza visuals do mapa
            this.updateFogOfWar();
            
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

        // Convert world coordinates for the next star to 2.5D
        const { x: destX, y: destY } = projectStar(nextStar, this.starfield.scaleFactor);

        // Create a tween for this single hop
        const tween = this.tweens.add({
            targets: sprite,
            x: destX,
            y: destY,
            duration: duration,
            onComplete: () => {
                // Update ship's location to the new star
                ship.currentLocation = nextStar;
                
                // Explora o novo sistema e atualiza o mapa
                this.universe.exploreNode(nextStar.source_id);
                this.updateFogOfWar();
                
                // NOVO: Atualiza risco dinâmico e verifica eventos do hop
                nextStar.piracyRisk = this.universe.recalculatePiracyRisk(nextStar);
                EventGenerator.checkDailyEvents(ship, this.company);
                
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

    private updateFogOfWar(): void {
        this.starfield.updateVisuals(this.universe);
    }

    private setupInputs() {
        this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
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

                const { x: worldX, y: worldY } = projectStar(star, this.starfield.scaleFactor);

                const dist = PhaserMath.Distance.Between(clickX, clickY, worldX, worldY);



                if (dist < minDistance) {

                    minDistance = dist;

                    closestStar = star;
                }

            }

            this.selectionGraphics.clear();
            if (closestStar) {
                const { x: targetX, y: targetY } = projectStar(closestStar, this.starfield.scaleFactor);

                this.selectionGraphics.lineStyle(2 / this.cameras.main.zoom, UIStyle.PALETTE.CONNECTION_LINE, 1);
                this.selectionGraphics.strokeCircle(targetX, targetY, 8 / this.cameras.main.zoom);

                EventBus.emit('star-selected', closestStar);

            } else {
                EventBus.emit('star-selected', null);
            }
        });
    }
    update(_time: number, delta: number): void {
        this.timeManager.update(delta, this.company);
        
        // Verificar condição de fim de jogo (período avaliativo ou falência)
        if (this.timeManager.day >= GameConfig.MAX_DAYS) {
            this.scene.stop('UIScene');
            this.scene.start('GameOver', { 
                playerName: this.company.name,
                playerCredits: this.company.credits,
                playerReputation: this.company.reputation,
                playerDominatedSystems: this.universe.stars.filter(s => s.owner === 'PLAYER').length,
                competitors: this.universe.competitors
            });
        } else if (this.company.credits <= 0) {
            this.scene.stop('UIScene');
            this.scene.start('GameOver', { 
                playerName: this.company.name,
                playerCredits: this.company.credits,
                playerReputation: this.company.reputation,
                playerDominatedSystems: this.universe.stars.filter(s => s.owner === 'PLAYER').length,
                competitors: this.universe.competitors,
                gameOverReason: 'BANKRUPTCY'
            });
        }
    }
}
