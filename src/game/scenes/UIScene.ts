// src/game/scenes/UIScene.ts
import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { GameConfig } from '../utils/GameConfig';
import { Company } from '../classes/Company';
import { Star } from '../classes/Universe';

export class UIScene extends Scene {
    private creditsText!: GameObjects.Text;
    private repText!: GameObjects.Text;
    private dateText!: GameObjects.Text;
    private targetPanel!: GameObjects.Container;
    private targetText!: GameObjects.Text;

    private companyInfo = new Company('Astro-Transit');

    constructor() {
        super('UIScene');
    }

    create() {

        const barHeight = 50;
        this.add.image(0, 0, 'topbar')
            .setOrigin(0, 0)
            .setDisplaySize(GameConfig.WIDTH, barHeight);

        const textStyle = { fontFamily: 'MinhaFonteSciFi, monospace', fontSize: 18, color: '#f2f2f2' };
        const highlightStyle = { fontFamily: 'MinhaFonteSciFi, monospace', fontSize: 20, color: '#00ff00', fontStyle: 'bold' };

        this.repText = this.add.text(20, barHeight / 2, ` ${this.companyInfo.name}  |   Rep: ${this.companyInfo.reputation}`, textStyle)
            .setOrigin(0, 0.5);

        this.creditsText = this.add.text(GameConfig.WIDTH / 2, barHeight / 2, ` ¢ ${this.companyInfo.credits.toLocaleString()}`, highlightStyle)
            .setOrigin(0.5, 0.5);

        this.createRightModule(barHeight);


        this.createFloatingTargetPanel();


        EventBus.on('update-credits', (newCredits: number) => {
            this.creditsText.setText(` ¢ ${newCredits.toLocaleString()}`);
        });

        EventBus.on('update-day', (day: number) => {
            this.dateText.setText(`DIA ${day}`);
        });

        EventBus.on('star-selected', (star: Star | null) => {
            if (star) {
                this.targetPanel.setVisible(true);
                const dist = Math.sqrt((star.x) ** 2 + (star.y) ** 2).toFixed(2);
                this.targetText.setText(`SISTEMA: ${star.source_id}\nDISTÂNCIA: ${dist} PC\nMAGNITUDE: ${star.phot_g_mean_mag.toFixed(1)}`);
            } else {
                this.targetPanel.setVisible(false);
            }
        });
    }

    private createRightModule(barHeight: number) {
        const rightEdge = GameConfig.WIDTH - 20;

        this.createIconButton(rightEdge - 20, barHeight / 2, 'icon_ff', () => EventBus.emit('time-fastforward'));

        this.createIconButton(rightEdge - 70, barHeight / 2, 'icon_play', () => EventBus.emit('time-play'));

        this.createIconButton(rightEdge - 120, barHeight / 2, 'icon_pause', () => EventBus.emit('time-pause'));

        this.dateText = this.add.text(rightEdge - 160, barHeight / 2, `DIA 1`, { fontFamily: 'MinhaFonteSciFi, monospace', fontSize: 18, color: '#ffffff' })
            .setOrigin(1, 0.5);
    }

    private createIconButton(x: number, y: number, texture: string, onClick: () => void) {
        const btn = this.add.image(x, y, texture)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5, 0.5)
            .setScale(0.7);
        btn.on('pointerover', () => btn.setTint(0x39c0f9));
        btn.on('pointerout', () => btn.clearTint());
        btn.on('pointerdown', () => {
            btn.setTint(0x00ff00);
            onClick();
        });
    }

    private createFloatingTargetPanel() {
        this.targetPanel = this.add.container(GameConfig.WIDTH - 320, GameConfig.HEIGHT - 180);

        const bg = this.add.rectangle(0, 0, 300, 160, 0x0b1d3a, 0.8).setOrigin(0, 0);
        bg.setStrokeStyle(1, 0x39c0f9);

        this.add.rectangle(0, 0, 300, 30, 0x39c0f9, 0.2).setOrigin(0, 0);
        const title = this.add.text(150, 15, 'DADOS DE TELEMETRIA', { fontFamily: 'MinhaFonteSciFi, monospace', fontSize: 14, color: '#39c0f9' }).setOrigin(0.5, 0.5);

        this.targetText = this.add.text(15, 45, '', { fontFamily: 'MinhaFonteSciFi, monospace', fontSize: 14, color: '#ffffff', lineSpacing: 8 });

        const contractBtnBg = this.add.rectangle(150, 130, 270, 36, 0xe6a822).setInteractive({ useHandCursor: true });
        const contractBtnText = this.add.text(150, 130, 'ANALISAR ROTAS COMERCIAIS', { fontFamily: 'MinhaFonteSciFi, monospace', fontSize: 14, color: '#000', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

        contractBtnBg.on('pointerover', () => contractBtnBg.setFillStyle(0xffc13b));
        contractBtnBg.on('pointerout', () => contractBtnBg.setFillStyle(0xe6a822));
        contractBtnBg.on('pointerdown', () => { contractBtnBg.setFillStyle(0xaa7700); alert("Gerar Contrato!"); });

        this.targetPanel.add([bg, title, this.targetText, contractBtnBg, contractBtnText]);
        //this.targetPanel.setVisible(false);
    }
}
