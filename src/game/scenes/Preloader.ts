import { Scene } from 'phaser';
import { buildPreloaderLayout } from './PreloaderLayout';
import { GAME_ASSET_MANIFEST, GameAssetKeys } from '../utils/GameAssets';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const layout = buildPreloaderLayout(this.scale.width, this.scale.height);

        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(layout.centerX, layout.centerY, GameAssetKeys.bootBackground)
            .setDisplaySize(layout.backgroundDisplayWidth, layout.backgroundDisplayHeight);

        this.add.rectangle(layout.centerX, layout.centerY, layout.barWidth, layout.barHeight, 0x041116, 0.72)
            .setStrokeStyle(2, 0x53d6c9, 0.9);
        const bar = this.add.rectangle(layout.barStartX, layout.centerY, 4, 22, 0x53d6c9, 0.95).setOrigin(0, 0.5);
        this.add.text(layout.centerX, layout.titleY, 'Carregando interface orbital', {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '22px',
            color: '#d9fffa',
            stroke: '#041116',
            strokeThickness: 4
        }).setOrigin(0.5);

        const percentLabel = this.add.text(layout.centerX, layout.percentY, '0%', {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '16px',
            color: '#8fe9d1'
        }).setOrigin(0.5);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar based on the responsive bar width.
            bar.width = 4 + (layout.barInnerWidth * progress);
            percentLabel.setText(`${Math.round(progress * 100)}%`);

        });

        this.load.json('mapa', 'assets/mapa_estelar_circular.json');
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        GAME_ASSET_MANIFEST.forEach((asset) => this.load.image(asset.key, asset.provisionalPath));
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        this.scene.start('MainMenu');
    }
}
