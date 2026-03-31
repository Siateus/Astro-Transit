// src/game/ui/UIFactory.ts
import { Scene, GameObjects } from 'phaser';
import { UIStyle } from './UIStyle';

export class UIFactory {

    public static createIconButton(scene: Scene, x: number, y: number, iconKey: string, callback: () => void): GameObjects.Container {
        const container = scene.add.container(x, y);
        const bg = this.createButtonBg(scene, 0, 0, 40, 40, UIStyle.PALETTE.PRIMARY_BLUE);
        const icon = scene.add.image(0, 0, iconKey).setDisplaySize(20, 20);

        bg.on('pointerdown', callback);

        container.add([bg, icon]);
        return container;
    }

    public static createTextButton(scene: Scene, x: number, y: number, text: string, colors: any, callback: () => void, fontSize: number = 12): GameObjects.Container {
        const container = scene.add.container(x, y);
        const textObj = scene.add.text(0, 0, text, {
            ...UIStyle.TYPOGRAPHY.PRESET.BUTTON_TEXT,
            fontSize: fontSize,
            color: colors.text
        }).setOrigin(0.5, 0.5);

        // Adjust dimensions based on text length
        const width = textObj.width + 30;
        const bg = this.createButtonBg(scene, 0, 0, width, 30, colors);
        bg.on('pointerdown', callback);

        container.add([bg, textObj]);
        return container;
    }

    public static createButton(scene: Scene, x: number, y: number, text: string, type: 'warning' | 'error' | 'success', callback: () => void): GameObjects.Container {
        const container = scene.add.container(x, y);
        let colors = UIStyle.PALETTE.PRIMARY_BLUE;
        
        if (type === 'warning') colors = UIStyle.PALETTE.WARNING as any;
        else if (type === 'error') colors = UIStyle.PALETTE.ERROR as any;
        else if (type === 'success') colors = UIStyle.PALETTE.SUCCESS as any;

        const textObj = scene.add.text(0, 0, text, {
            ...UIStyle.TYPOGRAPHY.PRESET.BUTTON_TEXT,
            color: colors.text
        }).setOrigin(0.5, 0.5);

        const width = textObj.width + 40;
        const bg = this.createButtonBg(scene, 0, 0, width, 35, colors);
        bg.on('pointerdown', callback);

        container.add([bg, textObj]);
        return container;
    }

    private static createButtonBg(scene: Scene, x: number, y: number, width: number, height: number, colors: any): GameObjects.Image {
        // Use a 9-Slice scaled image (Button01.png or Button04.png mapped to 'btn_01')
        const bg = scene.add.image(x, y, 'btn_01').setDisplaySize(width, height);
        bg.setInteractive({ useHandCursor: true });
        
        // Add tint for coloring
        if (colors && colors.bg) {
            bg.setTint(colors.bg);
        }

        // Hover events
        bg.on('pointerover', () => {
            if (colors && colors.hover) bg.setTint(colors.hover);
            else bg.setTint(0xcccccc);
        });
        bg.on('pointerout', () => {
             if (colors && colors.bg) bg.setTint(colors.bg);
             else bg.clearTint();
        });

        return bg;
    }

    public static createPanel(scene: Scene, x: number, y: number, width: number, height: number, title: string, type: 'warning' | 'info' = 'info'): GameObjects.Container {
        const container = scene.add.container(x, y);

        // Panel background using MainPanel01.png ('panel_main_01')
        const bg = scene.add.image(0, 0, 'panel_main_01').setOrigin(0, 0);
        bg.setDisplaySize(width, height);

        // Optional tint for warning/info distinction
        if (type === 'warning') {
            bg.setTint(0xffeebb);
        }

        // Title text
        const titleText = scene.add.text(width / 2, 20, title, UIStyle.TYPOGRAPHY.PRESET.PANEL_TITLE as any).setOrigin(0.5, 0.5);

        container.add([bg, titleText]);
        return container;
    }

    public static createDivider(scene: Scene, x: number, y: number, width: number, color: number): GameObjects.Rectangle {
        const rect = scene.add.rectangle(x, y, width, 2, color).setOrigin(0, 0);
        return rect;
    }

    public static createText(scene: Scene, x: number, y: number, text: string, presetName: 'status_bar' | 'body_text'): GameObjects.Text {
        const style = presetName === 'status_bar' ? UIStyle.TYPOGRAPHY.PRESET.STATUS_BAR : UIStyle.TYPOGRAPHY.PRESET.BODY_TEXT;
        const textObj = scene.add.text(x, y, text, style as any);
        return textObj;
    }
}
