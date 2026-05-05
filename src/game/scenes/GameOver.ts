import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameAssetKeys } from '../utils/GameAssets';

interface GameOverData {
    razao?: string;
}

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText : Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create (data: GameOverData)
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, GameAssetKeys.bootBackground);
        this.background.setAlpha(0.5);

        this.gameOverText = this.add.text(512, 384, `Game Over\n${data.razao ?? 'Operação encerrada'}`, {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        const menuButton = this.add.image(512, 548, GameAssetKeys.uiButtonPrimary).setDisplaySize(180, 42).setDepth(101);
        const menuLabel = this.add.text(512, 548, 'Menu', {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: 20,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(102);
        [menuButton, menuLabel].forEach((target) => {
            target.setInteractive({ useHandCursor: true });
            target.on('pointerover', () => menuButton.setAlpha(1));
            target.on('pointerout', () => menuButton.setAlpha(0.86));
            target.on('pointerdown', () => this.changeScene());
        });
        menuButton.setAlpha(0.86);
        this.input.keyboard?.on('keydown-ENTER', () => this.changeScene());
        this.input.keyboard?.on('keydown-ESC', () => this.changeScene());
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
