// src/game/scene
import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {

        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload() {
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        this.load.image('bg', 'Purple-Nebula-1.png');
        this.load.image('ui_button', '/UI/Button01.png')
        this.load.image('icon_play', 'play.png');
        this.load.image('icon_pause', 'pause.png');
        this.load.image('icon_ff', 'fast forward.png');
        this.load.image('topbar', '/UI/TitlePanel01.png')
        this.load.image('ship', 'ship.png');
        this.load.json('gaia_stars', 'gaia_stars_1000.json');

    }

    create() {
        this.scene.start('MainMenu');
    }
}
