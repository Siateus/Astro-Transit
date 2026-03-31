import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { GameConfig } from '../utils/GameConfig';
import { UIFactory } from '../ui/UIFactory';
import { UIStyle } from '../ui/UIStyle';

export class MainMenu extends Scene {
    background: GameObjects.Image;
    title: GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    create() {
        // Background
        this.background = this.add.image(0, 0, 'bg')
            .setOrigin(0, 0)
            .setDisplaySize(GameConfig.WIDTH, GameConfig.HEIGHT);

        // Title
        this.title = this.add.text(
            GameConfig.WIDTH / 2,
            GameConfig.HEIGHT * 0.25,
            'ASTRO-TRANSIT',
            UIStyle.TYPOGRAPHY.PRESET.TITLE_MAIN as any
        ).setOrigin(0.5, 0.5)
         .setDepth(50);

        // Button 1: Nova Empresa
        UIFactory.createTextButton(this, GameConfig.WIDTH / 2, GameConfig.HEIGHT * 0.5, 'NOVA EMPRESA', UIStyle.PALETTE.PRIMARY_BLUE, () => {
            this.changeScene();
        }, 16);

        // Button 2: Carregar Jogo
        UIFactory.createTextButton(this, GameConfig.WIDTH / 2, GameConfig.HEIGHT * 0.6, 'CARREGAR JOGO', UIStyle.PALETTE.PRIMARY_BLUE, () => {
            console.log('Carregar Jogo - em desenvolvimento');
        }, 14);

        // Button 3: Opções
        UIFactory.createTextButton(this, GameConfig.WIDTH / 2, GameConfig.HEIGHT * 0.7, 'OPÇÕES', UIStyle.PALETTE.PRIMARY_BLUE, () => {
            console.log('Opções - em desenvolvimento');
        }, 16);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene() {
        this.scene.start('Game');
    }
}
