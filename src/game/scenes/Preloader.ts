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

        // Core assets
        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        this.load.image('bg', 'Purple-Nebula-1.png');
        // Texturas do Mapa Galáctico
        this.load.image('galaxy_bg', 'galaxy_bg.png'); // Fundo da nebulosa
        this.load.image('star_aura', 'star_aura.png'); // Brilho suave (Soft glow)
        this.load.image('icon_play', 'play.png');
        this.load.image('icon_pause', 'pause.png');
        this.load.image('icon_ff', 'fast forward.png');
        this.load.image('ship', 'ship.png');
        this.load.json('gaia_stars', 'gaia_stars_500.json');

        // UI Buttons (16 variations)
        this.load.image('btn_01', '/UI/Button01.png');
        this.load.image('btn_02', '/UI/Button02.png');
        this.load.image('btn_03', '/UI/Button03.png');
        this.load.image('btn_04', '/UI/Button04.png');
        this.load.image('btn_05', '/UI/Button05.png');
        this.load.image('btn_06', '/UI/Button06.png');
        this.load.image('btn_07', '/UI/Button07.png');
        this.load.image('btn_08', '/UI/Button08.png');
        this.load.image('btn_09', '/UI/Button09.png');
        this.load.image('btn_10', '/UI/Button10.png');
        this.load.image('btn_11', '/UI/Button11.png');
        this.load.image('btn_12', '/UI/Button12.png');
        this.load.image('btn_13', '/UI/Button13.png');
        this.load.image('btn_14', '/UI/Button14.png');
        this.load.image('btn_15', '/UI/Button15.png');
        this.load.image('btn_16', '/UI/Button16.png');

        // UI Panels
        this.load.image('panel_main_01', '/UI/MainPanel01.png');
        this.load.image('panel_main_02', '/UI/MainPanel02.png');
        this.load.image('panel_main_03', '/UI/MainPanel03.png');

        this.load.image('panel_select_01', '/UI/SelectPanel01.png');
        this.load.image('panel_select_02', '/UI/SelectPanel02.png');
        this.load.image('panel_select_03', '/UI/SelectPanel03.png');

        this.load.image('panel_title_01', '/UI/TitlePanel01.png');
        this.load.image('panel_title_02', '/UI/TitlePanel02.png');

        // UI Elements
        this.load.image('slider_01', '/UI/Slider01.png');
        this.load.image('slider_02', '/UI/Slider02.png');
        this.load.image('switch_01', '/UI/Switch01.png');
        this.load.image('switch_02', '/UI/Switch02.png');
        this.load.image('switch_03', '/UI/Switch03.png');
        this.load.image('switch_04', '/UI/Switch04.png');
        this.load.image('switch_05', '/UI/Switch05.png');
        this.load.image('grid', '/UI/Grid.png');

    }

    create() {
        this.scene.start('MainMenu');
    }
}
