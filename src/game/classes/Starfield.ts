// src/game/classes/Starfield.ts
import { Scene, Math as PhaserMath } from 'phaser';
import { Universe, Star } from './Universe';
import { GameConfig } from '../utils/GameConfig';

export class Starfield {
    public readonly scaleFactor: number;

    constructor(scene: Scene, universe: Universe) {
        this.scaleFactor = GameConfig.SCALE_FACTOR;

        // Draw starlanes first (so they appear under the stars)
        this.renderStarlanes(scene, universe);

        if (!scene.textures.exists('dot')) {
            const graphic = scene.add.graphics();

            graphic.fillStyle(0xffffff, 1);
            graphic.fillCircle(8, 8, 8); // Desenha o círculo
            graphic.generateTexture('dot', 16, 16); // Salva como imagem 'dot'

            graphic.destroy();
        }

        const minScale = GameConfig.MIN_SCALE;
        const maxScale = GameConfig.MAX_SCALE;

        universe.stars.forEach(star => {
            const worldX = star.x * this.scaleFactor;
            const worldY = star.y * this.scaleFactor;

            const starImage = scene.add.image(worldX, worldY, 'dot');

            const magFactor = PhaserMath.Clamp((star.phot_g_mean_mag - 1) / 19, 0, 1);

            const alpha = PhaserMath.Linear(0.9, 0.2, magFactor);
            starImage.setAlpha(alpha);

            const scale = PhaserMath.Linear(maxScale, minScale, magFactor);
            starImage.setScale(scale);

            starImage.setTint(0xf2f2f2);
        });
    }

    private renderStarlanes(scene: Scene, universe: Universe): void {
        const graphics = scene.add.graphics();
        // Aumentei a espessura para 2 e a opacidade para 0.6 para as linhas brilharem mais
        graphics.lineStyle(2, 0x39c0f9, 0.6);
        // Create a set to track already-drawn connections (avoid duplicates)
        const drawnConnections = new Set<string>();

        universe.stars.forEach(starA => {
            if (!starA.connections || starA.connections.length === 0) return;

            starA.connections.forEach(connectedId => {
                const starB = universe.getStarById(connectedId);
                if (!starB) return;

                // Create a unique key for this connection (bidirectional)
                const key = [starA.source_id, connectedId].sort().join('-');
                if (drawnConnections.has(key)) return;
                drawnConnections.add(key);

                // Draw line between starA and starB
                const x1 = starA.x * this.scaleFactor;
                const y1 = starA.y * this.scaleFactor;
                const x2 = starB.x * this.scaleFactor;
                const y2 = starB.y * this.scaleFactor;

                // O método correto e mais otimizado no Phaser para ligar 2 pontos
                graphics.lineBetween(x1, y1, x2, y2);
            });
        });
    }
}
