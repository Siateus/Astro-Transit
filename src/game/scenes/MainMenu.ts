import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { GameConfig } from '../utils/GameConfig';

export class MainMenu extends Scene {
    background: GameObjects.Image;
    title: GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    create() {
        this.background = this.add.image(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(GameConfig.WIDTH, GameConfig.HEIGHT);

        this.title = this.add.text(GameConfig.WIDTH / 2, GameConfig.HEIGHT * 0.3, 'ASTRO-TRANSIT', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#39c0f9',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.createImageButton(GameConfig.HEIGHT * 0.5, 'Nova Empresa', () => {
            this.changeScene();
        });

        this.createImageButton(GameConfig.HEIGHT * 0.6, 'Carregar Jogo', () => {
            console.log('Lógica de Carregar Jogo a ser implementada...');
        });

        this.createImageButton(GameConfig.HEIGHT * 0.7, 'Opções', () => {
            console.log('Lógica de Opções a ser implementada...');
        });

        EventBus.emit('current-scene-ready', this);
    }

    private createImageButton(y: number, text: string, onClick: () => void) {
        const btnImage = this.add.image(GameConfig.WIDTH / 2, y, 'ui_button')
            .setInteractive({ useHandCursor: true });

        // Se a arte original for muito grande, descomente a linha abaixo para ajustar:
        // btnImage.setScale(0.8);

        // O Texto por cima da Imagem
        const btnText = this.add.text(GameConfig.WIDTH / 2, y, text, {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5); // O origin 0.5 centra o texto perfeitamente em cima da imagem

        // Efeito Hover (Rato por cima): Dá um tom azulado do tema à imagem do botão
        btnImage.on('pointerover', () => {
            btnImage.setTint(0x39c0f9);
        });

        // Efeito Out (Rato saiu): Remove o tom azulado
        btnImage.on('pointerout', () => {
            btnImage.clearTint();
        });

        // Efeito Clique: Fica ligeiramente mais escuro/pressionado
        btnImage.on('pointerdown', () => {
            btnImage.setTint(0x0b1d3a);
            onClick();
        });

        return btnImage;
    }

    changeScene() {
        this.scene.start('Game');
    }
}
