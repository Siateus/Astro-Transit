import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { CompetitorCompany } from '../classes/Universe';
import { GameConfig } from '../utils/GameConfig';
import { UIFactory } from '../ui/UIFactory';
import { UIStyle } from '../ui/UIStyle';

export class GameOver extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText: Phaser.GameObjects.Text;
    customData: any;

    constructor() {
        super('GameOver');
    }

    init(data: any) {
        this.customData = data;
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(UIStyle.PALETTE.BACKGROUND_DEEP_SPACE);

        // Background
        if (this.textures.exists('bg')) {
            this.background = this.add.image(GameConfig.WIDTH / 2, GameConfig.HEIGHT / 2, 'bg');
            this.background.setAlpha(0.3);
        }

        const playerData = this.customData;
        const reason = playerData?.gameOverReason || 'TIME_UP';
        const reasonText = reason === 'BANKRUPTCY' ? 'FALÊNCIA CORPORATIVA!' : 'FIM DE JOGO';

        // Title
        this.gameOverText = this.add.text(GameConfig.WIDTH / 2, 80, reasonText, UIStyle.TYPOGRAPHY.PRESET.TITLE_GAMEOVER as any)
            .setOrigin(0.5, 0.5).setDepth(50);

        // Ranking title
        this.add.text(GameConfig.WIDTH / 2, 160, 'RANKING FINAL', UIStyle.TYPOGRAPHY.PRESET.SUBTITLE_GAMEOVER as any)
            .setOrigin(0.5, 0.5);

        let yOffset = 220;

        // Player result
        if (playerData) {
            const playerResultText = `VOCÊ - ${playerData.playerName}\n¢${playerData.playerCredits?.toLocaleString() || '0'} | Reputação: ${playerData.playerReputation || 0} | Sistemas: ${playerData.playerDominatedSystems || 0}`;
            this.add.text(GameConfig.WIDTH / 2, yOffset, playerResultText, UIStyle.TYPOGRAPHY.PRESET.BODY_TEXT as any)
                .setOrigin(0.5);
            yOffset += 60;
        }

        // Competitors ranking
        if (playerData?.competitors && Array.isArray(playerData.competitors)) {
            this.add.text(GameConfig.WIDTH / 2, yOffset - 20, 'CONCORRENTES', UIStyle.TYPOGRAPHY.PRESET.HIGHLIGHT as any)
                .setOrigin(0.5);
            yOffset += 20;

            playerData.competitors.forEach((comp: CompetitorCompany, idx: number) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                const compText = `${medal} ${comp.name}: ¢${comp.credits?.toLocaleString() || '0'} | Rep: ${comp.reputation || 0}`;
                this.add.text(GameConfig.WIDTH / 2, yOffset, compText, UIStyle.TYPOGRAPHY.PRESET.BODY_TEXT as any)
                    .setOrigin(0.5);
                yOffset += 25;
            });
        }

        // Return button
        UIFactory.createTextButton(this, GameConfig.WIDTH / 2, GameConfig.HEIGHT - 60, 'VOLTAR AO MENU', UIStyle.PALETTE.PRIMARY_BLUE, () => {
            this.changeScene();
        }, 16);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene() {
        this.scene.start('MainMenu');
    }
}
