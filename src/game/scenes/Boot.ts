import { Scene } from 'phaser';
import { BOOT_ASSET_MANIFEST } from '../utils/GameAssets';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        BOOT_ASSET_MANIFEST.forEach((asset) => this.load.image(asset.key, asset.provisionalPath));
        this.load.json('mapa', 'assets/mapa_estelar_circular.json');
    }

    create() {
        this.scene.start('Preloader');
    }
}
