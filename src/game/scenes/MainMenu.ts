import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { PersistenceManager } from "../simulation/persistence";
import { GameAssetKeys } from "../utils/GameAssets";
import { buildMainMenuLayout } from "./MainMenuLayout";

interface MenuEntry {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Rectangle;
  enabled: boolean;
  disabledHint?: string;
}

export class MainMenu extends Phaser.Scene {
  private readonly entries: MenuEntry[] = [];
  private footerHint?: Phaser.GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x05070b);

    this.createBackdrop();
    this.createTitleBlock();
    this.createMenuColumn();
    this.createFooterHint();

    EventBus.emit("current-scene-ready", this);
  }

  private createBackdrop() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width / 2, height / 2, GameAssetKeys.menuBackdrop)
      .setDisplaySize(width, height)
      .setAlpha(0.62);

    const tint = this.add.graphics();
    tint.fillGradientStyle(0x020509, 0x071016, 0x091019, 0x020509, 0.98, 0.76, 0.78, 0.96);
    tint.fillRect(0, 0, width, height);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x020305, 0.22);
    vignette.fillRect(0, 0, width, height);

    const leftShade = this.add.graphics();
    leftShade.fillStyle(0x010204, 0.76);
    leftShade.fillRect(0, 0, width * 0.38, height);
    leftShade.lineStyle(1, 0x56d6cd, 0.2);
    leftShade.lineBetween(width * 0.38, 24, width * 0.38, height - 24);

    const captain = this.add.image(width * 0.83, height * 0.58, GameAssetKeys.characterCaptain)
      .setDisplaySize(250, 250)
      .setAlpha(0.82);
    captain.setDepth(1);

    const ceo = this.add.image(width * 0.68, height * 0.64, GameAssetKeys.characterCeo)
      .setDisplaySize(180, 180)
      .setAlpha(0.58);
    ceo.setDepth(1);

    const starField = this.add.particles(0, 0, GameAssetKeys.star, {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      quantity: 2,
      frequency: 140,
      lifespan: 16000,
      alpha: { start: 0.42, end: 0 },
      scale: { start: 0.07, end: 0.01 },
      speedX: { min: -1, max: 1 },
      speedY: { min: -0.5, max: 0.5 },
      blendMode: "ADD"
    });
    starField.setDepth(2);

    const frame = this.add.graphics();
    frame.lineStyle(1, 0x24434a, 0.8);
    frame.strokeRect(6, 6, width - 12, height - 12);
    frame.lineStyle(1, 0x66d8cf, 0.25);
    frame.strokeRect(12, 12, width - 24, height - 24);
  }

  private createTitleBlock() {
    const layout = buildMainMenuLayout(this.scale.width, this.scale.height);

    const title = this.add.text(layout.titleX, layout.titleY, "ASTRO TRANSIT", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "58px",
      color: "#f0f6f7",
      letterSpacing: 16
    });
    title.setAlpha(0.96);

    const subtitle = this.add.text(layout.subtitleX, layout.subtitleY, "INTERSTELLAR LOGISTICS DIRECTORATE", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "12px",
      color: "#7aa8ac",
      letterSpacing: 2
    });
    subtitle.setAlpha(0.92);
  }

  private createMenuColumn() {
    const layout = buildMainMenuLayout(this.scale.width, this.scale.height);
    const hasSave = PersistenceManager.hasSave();
    const items = [
      { label: "Nova empresa", enabled: true },
      { label: "Continuar", enabled: hasSave, disabledHint: "Nenhum salvamento encontrado." },
      { label: "Opcoes", enabled: false, disabledHint: "Opcoes ainda nao disponiveis neste prototipo." }
    ];

    items.forEach((item, index) => {
      const y = layout.menuStartY + (index * layout.menuGap);
      const bg = this.add.image(layout.menuX, y, index === 0 ? GameAssetKeys.uiButtonBarActive : GameAssetKeys.uiButtonBar)
        .setOrigin(0, 0.5)
        .setDisplaySize(layout.menuButtonWidth, layout.menuButtonHeight)
        .setAlpha(item.enabled ? (index === 0 ? 0.96 : 0.78) : 0.28);

      const label = this.add.text(layout.menuX + 22, y, item.label, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "20px",
        color: index === 0 ? "#e9f8f7" : "#c4d2d4"
      }).setOrigin(0, 0.5);
      label.setAlpha(item.enabled ? (index === 0 ? 1 : 0.88) : 0.36);

      const hit = this.add.rectangle(
        layout.hitAreaX,
        y + layout.hitAreaYOffset,
        layout.hitAreaWidth,
        layout.hitAreaHeight,
        0x000000,
        0.001
      ).setOrigin(0, 0);
      hit.setInteractive({ useHandCursor: true });

      const container = this.add.container(0, 0, [bg, hit, label]);

      hit.on("pointerover", () => this.highlightEntry(index));
      hit.on("pointerout", () => this.highlightEntry(this.getSelectedIndex()));
      hit.on("pointerdown", () => {
        if (index === 0) {
          this.scene.start("Game", { mode: "new" });
        }

        if (index === 1 && hasSave) {
          this.scene.start("Game", { mode: "continue" });
          return;
        }

        if (!item.enabled) {
          this.setFooterHint(item.disabledHint ?? "Opcao indisponivel.");
        }
      });

      this.entries.push({ container, bg, label, hit, enabled: item.enabled, disabledHint: item.disabledHint });
    });

    this.highlightEntry(0);
  }

  private createFooterHint() {
    const layout = buildMainMenuLayout(this.scale.width, this.scale.height);

    this.footerHint = this.add.text(layout.footerX, layout.footerY, "Selecione uma opcao disponivel para iniciar a operacao.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#6f8b90"
    });
  }

  private highlightEntry(activeIndex: number) {
    this.entries.forEach((entry, index) => {
      const isActive = index === activeIndex && entry.enabled;
      entry.label.setColor(isActive ? "#f2fbfb" : "#c4d2d4");
      entry.label.setAlpha(!entry.enabled ? 0.34 : isActive ? 1 : index === 0 ? 0.9 : 0.72);
      entry.bg.setTexture(isActive ? GameAssetKeys.uiButtonBarActive : GameAssetKeys.uiButtonBar);
      entry.bg.setAlpha(!entry.enabled ? 0.28 : isActive ? 0.98 : 0.72);
      entry.hit.input!.cursor = entry.enabled ? "pointer" : "default";
    });
  }

  private setFooterHint(text: string) {
    this.footerHint?.setText(text).setColor("#ffbf82");
  }

  private getSelectedIndex() {
    return 0;
  }
}
