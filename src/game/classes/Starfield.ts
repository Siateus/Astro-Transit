// src/game/classes/Starfield.ts
import { Scene, Math as PhaserMath } from 'phaser';
import { Universe } from './Universe';
import { GameConfig } from '../utils/GameConfig';

export class Starfield {
    public readonly scaleFactor: number;

    constructor(scene: Scene, universe: Universe) {
        if (!scene.textures.exists('dot')) {
            this.scaleFactor = GameConfig.SCALE_FACTOR;
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
            starImage.setScale(scale); // Agora o TypeScript fica feliz!

            starImage.setTint(0xf2f2f2);
        });
    }
}
