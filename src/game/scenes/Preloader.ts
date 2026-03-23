// src/game/scenes/Preloader.ts
import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        // Barra de progresso visual (útil para o ficheiro JSON que é mais pesado)
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload() {
        // Define que todos os ficheiros vão ser procurados na pasta public/assets/
        this.load.setPath('assets');

        // Carrega as imagens visuais
        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        this.load.image('bg', 'bg.png'); // Adicionado o seu fundo!

        // O FICHEIRO MAIS IMPORTANTE: Carrega os dados reais do Gaia!
        this.load.json('gaia_stars', 'gaia_stars.json');
    }

    create() {
        // Quando terminar de descarregar tudo, transita para o Hangar/Menu Principal
        this.scene.start('MainMenu');
    }
}
