// src/game/classes/Starfield.ts
import { Scene } from 'phaser';
import { Universe, projectStar } from './Universe';
import { GameConfig } from '../utils/GameConfig';
import { UIStyle } from '../ui/UIStyle';

export class Starfield {
    private lastScaleFactor: number = 0;
    private graphics!: Phaser.GameObjects.Graphics;
    private starSprites: Map<number, Phaser.GameObjects.Image> = new Map();
    private glowSprites: Map<number, Phaser.GameObjects.Image> = new Map();
    private labelTexts: Map<number, Phaser.GameObjects.Text> = new Map();
    private regionBadges: Map<number, Phaser.GameObjects.Text> = new Map();
    private territoryImage: Phaser.GameObjects.Image | null = null;
    private nebulaLayers: Phaser.GameObjects.Image[] = [];
    private sceneRef: Scene;
    private lastZoomLevel: number = 0;

    public get scaleFactor(): number {
        return GameConfig.SCALE_FACTOR;
    }

    constructor(scene: Scene, universe: Universe) {
        this.sceneRef = scene;
        this.lastScaleFactor = this.scaleFactor;

        // Cria o graphics object para as starlanes
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(0); // Rotas ficam em depth 0

        // Gera as Nebulosas Procedurais por Região (Fase 1)
        this.generateNebulaLayers(universe);

        // Núcleo galáctico gigante e procedural (Stellaris Core)
        if (!scene.textures.exists('galactic_core')) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)'); // Brilho intenso no epicentro
                gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.2)');
                gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1024, 1024);
                scene.textures.addCanvas('galactic_core', canvas);
            }
        }
        
        // Ponto central em 0,0 para o Core
        const coreImg = scene.add.image(0, 0, 'galactic_core');
        coreImg.setBlendMode(Phaser.BlendModes.ADD);
        coreImg.setScale(5.0, 2.5); // Core bem longo na horizontal cobrindo o disco
        coreImg.setDepth(-2); 
        coreImg.setAlpha(0.6);

        // Estrela Singela (Sem aura neon)
        if (!scene.textures.exists('dot')) {
            const graphic = scene.add.graphics();
            graphic.fillStyle(UIStyle.PALETTE.STAR_NEUTRAL, 1);
            graphic.fillCircle(8, 8, 8);
            graphic.generateTexture('dot', 16, 16);
            graphic.destroy();
        }

        // Criar Glow Texture (Fase 2: Teste de glows)
        if (!scene.textures.exists('star_glow')) {
            const glowCanvas = document.createElement('canvas');
            glowCanvas.width = 64;
            glowCanvas.height = 64;
            const glowCtx = glowCanvas.getContext('2d');
            if (glowCtx) {
                const gradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                glowCtx.fillStyle = gradient;
                glowCtx.fillRect(0, 0, 64, 64);
                scene.textures.addCanvas('star_glow', glowCanvas);
            }
        }

        universe.stars.forEach(star => {
            const { x: worldX, y: worldY } = projectStar(star, this.scaleFactor);
            
            // Núcleo focado sem Bloom absurdo
            const core = scene.add.image(worldX, worldY, 'dot');
            core.setDepth(1); // Estrelas ficam por cima
            this.starSprites.set(star.source_id, core);

            // Glow layer (Fase 2)
            const glow = scene.add.image(worldX, worldY, 'star_glow');
            glow.setDepth(0.5); // Atrás das estrelas
            glow.setAlpha(0);
            this.glowSprites.set(star.source_id, glow);

            // Fase 4: Labels de sistemas
            const label = scene.add.text(worldX + 15, worldY - 15, `System ${star.source_id}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#aaaaaa',
                align: 'left'
            });
            label.setOrigin(0, 0.5);
            label.setDepth(2);
            label.setAlpha(0); // Começar invisível
            this.labelTexts.set(star.source_id, label);

            // Fase 4: Badge de região (para debug/info)
            const regionShort = (star.region || 'CORE').substring(0, 1);
            const regionText = scene.add.text(worldX - 15, worldY - 15, regionShort, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '8px',
                color: '#666666',
                align: 'center',
                backgroundColor: '#111111',
                padding: { x: 2, y: 1 }
            });
            regionText.setOrigin(1, 0.5);
            regionText.setDepth(2);
            regionText.setAlpha(0);
            this.regionBadges.set(star.source_id, regionText);
        });

        this.updateVisuals(universe);
    }

    public setupCameraListeners(): void {
        // Fase 4: Atualizar labels quando câmera se move/faz zoom
        const camera = this.sceneRef.cameras.main;
        camera.on('camerazoom', () => {
            // Será atualizado no próximo frame through updateVisuals
        });
    }

    public updateVisuals(universe: Universe): void {
        // Detecta mudança de SCALE_FACTOR e reinicializa os layers
        if (Math.abs(this.scaleFactor - this.lastScaleFactor) > 0.01) {
            this.lastScaleFactor = this.scaleFactor;
            // Limpa e regenera nebulosas/territórios
            this.nebulaLayers.forEach(n => n.destroy());
            this.nebulaLayers = [];
            if (this.territoryImage) this.territoryImage.destroy();
            this.generateNebulaLayers(universe);
            this.renderTerritories(this.sceneRef, universe);
        }

        this.graphics.clear();

        // 1. Renderiza Starlanes (Rotas - Finas e Sutis como o Stellaris)
        const drawnConnections = new Set<string>();
        universe.stars.forEach(starA => {
            if (!starA.connections || starA.connections.length === 0) return;
            if (GameConfig.FOG_OF_WAR_ENABLED && !starA.isExplored) return;

            starA.connections.forEach(connectedId => {
                const starB = universe.getStarById(connectedId);
                if (!starB) return;
                if (GameConfig.FOG_OF_WAR_ENABLED && !starA.isExplored && !starB.isExplored) return;

                const key = [starA.source_id, connectedId].sort().join('-');
                if (drawnConnections.has(key)) return;
                drawnConnections.add(key);

                const pA = projectStar(starA, this.scaleFactor);
                const pB = projectStar(starB, this.scaleFactor);
                const x1 = pA.x;
                const y1 = pA.y;
                const x2 = pB.x;
                const y2 = pB.y;

                // Fase 3: Rotas Dinâmicas com cores baseadas em regiões conectadas
                const lineColor = this.getRouteColorByRegions(starA.region || 'CORE', starB.region || 'CORE');
                const lineAlpha = 0.5; // Aumentado de 0.15 para melhorar visibilidade
                const lineWidth = 2;   // Aumentado de 1 para melhorar visibilidade

                // Desenha a linha principal com a cor dinâmica
                this.graphics.lineStyle(lineWidth, lineColor, lineAlpha);
                this.graphics.lineBetween(x1, y1, x2, y2);

                // Fase 3: Efeito de fluxo desabilitado para performance
                // const flowOffset = (timeMs * 0.0003) % 1; // Normaliza para 0-1
                // this.drawFlowEffect(x1, y1, x2, y2, lineColor, flowOffset);
            });
        });

        // 2. Renderiza Estrelas (Fase 2: Com cores por região e glows)
        const timeMs = Date.now();

        this.starSprites.forEach((core, starId) => {
            const star = universe.getStarById(starId);
            if (!star) return;

            // Tamanho uniforme para TODOS os sistemas - sem variações
            const SYSTEM_SIZE = 0.8;

            if (!GameConfig.FOG_OF_WAR_ENABLED || star.isExplored) {
                core.setVisible(true);
                
                // Obter cor baseada em região (Fase 2)
                const { color, glowColor, glowIntensity } = this.getStarColorByRegion(star);
                
                // Todos com tamanho idêntico - diferenciação apenas por cor/glow
                let cAlpha = 0.9;
                if (star.owner === 'PLAYER') {
                    cAlpha = 1.0;
                } else if (star.owner && star.owner !== 'PLAYER') {
                    cAlpha = 0.95;
                } else if (star.hasStation) {
                    cAlpha = 1.0;
                } else {
                    cAlpha = 0.7;
                }

                core.setTint(color).setScale(SYSTEM_SIZE).setAlpha(cAlpha);

                // Aplicar glow dinâmico (Fase 2) - OTIMIZADO
                const glow = this.glowSprites.get(starId);
                if (glow) {
                    // Pulsação suave APENAS para jogador, menos frequente
                    const isPulsing = star.owner === 'PLAYER';
                    const pulseFactor = isPulsing ? 0.3 + 0.2 * Math.sin(timeMs * 0.001) : 0;
                    
                    glow.setTint(glowColor)
                        .setScale(SYSTEM_SIZE * (0.5 + pulseFactor * 0.2))
                        .setAlpha(glowIntensity * (0.1 + pulseFactor * 0.1));
                }
            } else {
                // Fog of War - tamanho reduzido mas mesma base
                core.setTint(UIStyle.PALETTE.BACKGROUND_DARK).setScale(SYSTEM_SIZE * 0.25).setAlpha(0.1);
                
                const glow = this.glowSprites.get(starId);
                if (glow) {
                    glow.setAlpha(0);
                }
            }
        });

        // 3. Renderiza Territórios (O "Blob" contíguo estilo Stellaris)
        this.renderTerritories(this.sceneRef, universe);

        // Fase 4: Atualiza visibilidade dos labels baseado em zoom
        this.updateLabelVisibility(universe);
    }

    private updateLabelVisibility(universe: Universe): void {
        // Fase 4: Labels e UI do Mapa - OTIMIZADO com throttling
        const camera = this.sceneRef.cameras.main;
        const zoomLevel = camera.zoom;

        // OTIMIZAÇÃO: Não atualizar labels a cada frame, apenas quando zoom muda significantemente
        if (this.lastZoomLevel > 0 && Math.abs(zoomLevel - this.lastZoomLevel) < 0.05) {
            return; // Skip se zoom mudou menos de 5%
        }
        this.lastZoomLevel = zoomLevel;

        const labelShowThreshold = 1.2; // Labels apenas muito próximos
        const badgeShowThreshold = 1.5; // Badges ainda mais perto

        // OTIMIZAÇÃO: Atualizar apenas labels visíveis (não todos os 1000+)
        for (const [starId, labelText] of this.labelTexts) {
            const star = universe.getStarById(starId);
            if (!star) continue;

            const shouldShowLabel = zoomLevel >= labelShowThreshold;
            labelText.setAlpha(shouldShowLabel ? 0.8 : 0);
            
            if (shouldShowLabel) {
                if (star.owner === 'PLAYER') {
                    labelText.setColor('#00d2ff');
                } else if (star.owner) {
                    labelText.setColor('#ff6666');
                } else if (star.hasStation) {
                    labelText.setColor('#88ff88');
                } else {
                    labelText.setColor('#aaaaaa');
                }
            }
        }

        for (const badgeText of this.regionBadges.values()) {
            const shouldShowBadge = zoomLevel >= badgeShowThreshold;
            badgeText.setAlpha(shouldShowBadge ? 0.6 : 0);
        }
    }

    private getStarColorByRegion(star: Universe['stars'][0]): { color: number; glowColor: number; glowIntensity: number } {
        // Fase 2: Cores baseadas em região
        const regionColorMap: Record<string, { color: number; glowColor: number; glowIntensity: number }> = {
            'CORE': { 
                color: 0x99ccff,      // Azul claro
                glowColor: 0x3366ff,  // Azul brilhante
                glowIntensity: 0.5
            },
            'MID_RIM': { 
                color: 0xdd99ff,      // Roxo/Magenta
                glowColor: 0xaa33ff,  // Roxo brilhante
                glowIntensity: 0.4
            },
            'OUTER_RIM': { 
                color: 0xff9999,      // Vermelho/Rosa
                glowColor: 0xff3333,  // Vermelho brilhante
                glowIntensity: 0.35
            }
        };

        let baseConfig = regionColorMap[star.region || 'CORE'];

        // Se a estrela for controlada, mudar cor para refletir ownership
        if (star.owner === 'PLAYER') {
            return {
                color: 0xffffff,      // Branco puro para jogador
                glowColor: 0x00d2ff,  // Ciano brilhante
                glowIntensity: 0.7
            };
        } else if (star.owner === 'Void Express Corp') {
            return {
                color: 0xff9999,
                glowColor: 0xff3366,
                glowIntensity: 0.5
            };
        } else if (star.owner === 'Stellar Freight Inc') {
            return {
                color: 0x99ff99,
                glowColor: 0x33cc33,
                glowIntensity: 0.5
            };
        } else if (star.owner === 'Galaxy Logistics') {
            return {
                color: 0xcc99ff,
                glowColor: 0xaa00ff,
                glowIntensity: 0.5
            };
        } else if (star.hasStation) {
            // Estações têm brilho especial
            return {
                color: baseConfig.color,
                glowColor: baseConfig.glowColor,
                glowIntensity: baseConfig.glowIntensity + 0.2
            };
        }

        return baseConfig;
    }

    private getRouteColorByRegions(regionA: string, regionB: string): number {
        // Fase 3: Determina cor da rota baseada nas regiões conectadas
        if (regionA === 'CORE' && regionB === 'CORE') {
            return 0x3366ff; // Azul brilhante para rotas no core
        } else if (regionA === 'OUTER_RIM' && regionB === 'OUTER_RIM') {
            return 0xff3333; // Vermelho brilhante para rotas na borda
        } else if ((regionA === 'CORE' && regionB === 'MID_RIM') || (regionA === 'MID_RIM' && regionB === 'CORE')) {
            return 0x66ccff; // Ciano para transição core-midrim
        } else if ((regionA === 'MID_RIM' && regionB === 'OUTER_RIM') || (regionA === 'OUTER_RIM' && regionB === 'MID_RIM')) {
            return 0xff9966; // Laranja para transição midrim-outer
        } else if ((regionA === 'CORE' && regionB === 'OUTER_RIM') || (regionA === 'OUTER_RIM' && regionB === 'CORE')) {
            return 0xcc66ff; // Roxo para conexão direta core-outer
        }
        return 0x556677; // Cinza como fallback
    }

    private generateNebulaLayers(universe: Universe): void {
        // Nebulosas por Região com cores específicas (Fase 1)
        const regionColors = {
            'CORE': { r: 0, g: 51, b: 136, name: 'nebula_core' },        // Azul
            'MID_RIM': { r: 102, g: 51, b: 136, name: 'nebula_midrim' }, // Roxo/Magenta
            'OUTER_RIM': { r: 136, g: 51, b: 51, name: 'nebula_outerrim' } // Vermelho/Crimson
        };

        // Processa cada região e gera sua nebulosa
        Object.entries(regionColors).forEach(([region, colorConfig]) => {
            const regionStars = universe.stars.filter(s => s.region === region);
            if (regionStars.length === 0) return;

            // Calcula bounds da região
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            regionStars.forEach(star => {
                const { x: worldX, y: worldY } = projectStar(star, this.scaleFactor);
                if (worldX < minX) minX = worldX;
                if (worldX > maxX) maxX = worldX;
                if (worldY < minY) minY = worldY;
                if (worldY > maxY) maxY = worldY;
            });

            const padding = 600;
            minX -= padding; maxX += padding;
            minY -= padding; maxY += padding;
            let width = Math.ceil(maxX - minX);
            let height = Math.ceil(maxY - minY);

            if (width <= 0 || height <= 0) return;

            // OTIMIZAÇÃO: Limitar tamanho máximo de nebula (512x512 pixels)
            const MAX_NEBULA_SIZE = 512;
            if (width > MAX_NEBULA_SIZE) width = MAX_NEBULA_SIZE;
            if (height > MAX_NEBULA_SIZE) height = MAX_NEBULA_SIZE;

            // Cria canvas para a nebulosa
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Preenche com cor base
            ctx.fillStyle = `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, 0.08)`;
            ctx.fillRect(0, 0, width, height);

            // OTIMIZAÇÃO: Reduzir número de gradientes (amostrar apenas 1 a cada 5 estrelas)
            const starSample = Math.max(1, Math.floor(regionStars.length / 5));
            for (let i = 0; i < regionStars.length; i += starSample) {
                const star = regionStars[i];
                const { x: sx, y: sy } = projectStar(star, this.scaleFactor);
                const cx = Math.min(Math.max(sx - minX, 0), width);
                const cy = Math.min(Math.max(sy - minY, 0), height);

                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
                gradient.addColorStop(0, `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, 0.1)`);
                gradient.addColorStop(0.5, `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, 0.02)`);
                gradient.addColorStop(1, `rgba(${colorConfig.r}, ${colorConfig.g}, ${colorConfig.b}, 0)`);

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            // Adiciona à textura do Phaser
            if (this.sceneRef.textures.exists(colorConfig.name)) {
                this.sceneRef.textures.remove(colorConfig.name);
            }
            this.sceneRef.textures.addCanvas(colorConfig.name, canvas);

            // Cria a imagem da nebulosa e a adiciona ao world
            const nebulaImg = this.sceneRef.add.image(minX, minY, colorConfig.name);
            nebulaImg.setOrigin(0, 0);
            nebulaImg.setDepth(-3); // Atrás de tudo
            nebulaImg.setAlpha(0.25); // Reduzido de 0.5
            nebulaImg.setBlendMode(Phaser.BlendModes.ADD);
            this.nebulaLayers.push(nebulaImg);
        });
    }

    private renderTerritories(scene: Scene, universe: Universe) {
        // Obter os bounds do mapa inteiro
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        universe.stars.forEach(star => {
            const { x: worldX, y: worldY } = projectStar(star, this.scaleFactor);
            if (worldX < minX) minX = worldX;
            if (worldX > maxX) maxX = worldX;
            if (worldY < minY) minY = worldY;
            if (worldY > maxY) maxY = worldY;
        });

        const padding = 250;
        minX -= padding; maxX += padding;
        minY -= padding; maxY += padding;
        const width = Math.ceil(maxX - minX);
        const height = Math.ceil(maxY - minY);

        if (width <= 0 || height <= 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const getFactionColor = (f: string) => {
            if (f === 'PLAYER') return '#00d2ff'; // Ciano
            if (f === 'Void Express Corp') return '#ff3366'; // Vermelho
            if (f === 'Stellar Freight Inc') return '#33cc33'; // Verde
            if (f === 'Galaxy Logistics') return '#cc33ff'; // Roxo
            return '#aaaaaa';
        };

        const RADIUS = 75;  // Aumentado para acompanhar SCALE_FACTOR 2.8
        const BORDER_THICKNESS = 4; // Borda mais fina

        // Fazer um array contendo o Player e os competidores, assumindo universe.competitors existe
        const factions = ['PLAYER', ...universe.competitors.map(c => c.name)];

        factions.forEach(faction => {
            const ownedStars = universe.stars.filter(s => s.owner === faction);
            if (ownedStars.length === 0) return;

            const color = getFactionColor(faction);

            // Borda Externa Mask
            const bCanvas = document.createElement('canvas');
            bCanvas.width = width; bCanvas.height = height;
            const bCtx = bCanvas.getContext('2d')!;
            bCtx.fillStyle = color;
            ownedStars.forEach(s => {
                const { x: sx, y: sy } = projectStar(s, this.scaleFactor);
                const cx = sx - minX;
                const cy = sy - minY;
                bCtx.beginPath();
                bCtx.arc(cx, cy, RADIUS + BORDER_THICKNESS, 0, Math.PI * 2);
                bCtx.fill();
            });

            // Preenchimento Interno Mask
            const fCanvas = document.createElement('canvas');
            fCanvas.width = width; fCanvas.height = height;
            const fCtx = fCanvas.getContext('2d')!;
            fCtx.fillStyle = color;
            ownedStars.forEach(s => {
                const { x: sx, y: sy } = projectStar(s, this.scaleFactor);
                const cx = sx - minX;
                const cy = sy - minY;
                fCtx.beginPath();
                fCtx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
                fCtx.fill();
            });

            // Recorta o Interior da Borda Exterta = Borda Oca!
            bCtx.globalCompositeOperation = 'destination-out';
            bCtx.drawImage(fCanvas, 0, 0);

            // Multiplica a altura do blob para ficar com aspeto 3D de disco (achatar os circulos)
            // Se as coordenadas das estrelas já estiverem esmagadas no Y, os circulos à sua volta vão
            // parecer estar num ecrã normal. Temos que desenhar Elipses alterando os bounds, 
            // ou mais fácil, dar scale no Canvas global antes de desenhar:
            // ctx.setTransform(1, 0, 0, Math.cos(Math.PI/3), 0, 0); // mas já é tarde se passarmos fCanvas
            
            // Desenha Fill (Traslúcido) no Principal (muito sutil)
            ctx.globalAlpha = 0.1; 
            
            // Aplicamos a escala 2.5D no eixo Y global da imagem de territórios 
            // (Melhor aplicarmos via setScale(1, 0.5) no this.territoryImage lá em baixo)
            ctx.drawImage(fCanvas, 0, 0);

            // Desenha Borda (Sólida) no Principal com menos agressão
            ctx.globalAlpha = 0.8; 
            ctx.drawImage(bCanvas, 0, 0);
        });

        // Limpa a textura antiga se houver
        if (scene.textures.exists('territory_map')) {
            scene.textures.remove('territory_map');
        }
        scene.textures.addCanvas('territory_map', canvas);

        if (this.territoryImage) {
            this.territoryImage.destroy();
        }
        
        // Coloca a nova foto e ESMACHA o Y para o aspeto disco 2.5D global!
        // IMPORTANTE: NÃO FAZEMOS scaleY aqui porque os (minX, minY) e cx, cy já são dos pontos PROJETADOS,
        // o que significa que as posições já formam um elipsoide.
        // As auras de território manter-se-ão perfeitamente circulares à volta das estrelas projetadas,
        // o que é a decisão correta para a "espessura" do blob num plano de jogo espacial em top-down inclinado.
        this.territoryImage = scene.add.image(minX, minY, 'territory_map');
        this.territoryImage.setOrigin(0, 0);
        this.territoryImage.setDepth(-1); // Abaixo das starlanes (0), acima do core (-2)
    }
}
