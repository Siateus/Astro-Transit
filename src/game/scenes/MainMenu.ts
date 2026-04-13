import Phaser from "phaser";
import { EventBus } from "../EventBus";

interface MenuEntry {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  underline: Phaser.GameObjects.Rectangle;
  hit: Phaser.GameObjects.Rectangle;
}

export class MainMenu extends Phaser.Scene {
  private readonly entries: MenuEntry[] = [];

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

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x090c12, 0x090c12, 0x17131c, 0x090c12, 1, 1, 1, 1);
    bg.fillRect(0, 0, width, height);

    const haze = this.add.graphics();
    haze.fillStyle(0x67b3ff, 0.06);
    haze.fillCircle(width * 0.72, height * 0.22, 150);
    haze.fillStyle(0xffb36a, 0.05);
    haze.fillCircle(width * 0.62, height * 0.58, 220);
    haze.fillStyle(0x9e8cff, 0.04);
    haze.fillCircle(width * 0.82, height * 0.78, 180);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x020305, 0.24);
    vignette.fillRect(0, 0, width, height);

    const leftShade = this.add.graphics();
    leftShade.fillGradientStyle(0x010204, 0x010204, 0x010204, 0x010204, 0.82, 0.28, 0.82, 0.2);
    leftShade.fillRect(0, 0, width * 0.34, height);

    const starField = this.add.particles(0, 0, "star", {
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
    const title = this.add.text(34, 28, "ASTRO TRANSIT", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "58px",
      color: "#f0f6f7",
      letterSpacing: 16
    });
    title.setAlpha(0.96);

    const subtitle = this.add.text(38, 102, "INTERSTELLAR LOGISTICS DIRECTORATE", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "12px",
      color: "#7aa8ac",
      letterSpacing: 2
    });
    subtitle.setAlpha(0.92);
  }

  private createMenuColumn() {
    const items = ["Nova empresa", "Continuar", "Opcoes"];
    const startX = 40;
    const startY = 218;
    const gap = 56;

    items.forEach((item, index) => {
      const y = startY + (index * gap);
      const label = this.add.text(startX, y, item, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "23px",
        color: index === 0 ? "#e9f8f7" : "#c4d2d4"
      });
      label.setAlpha(index === 0 ? 1 : 0.88);

      const underline = this.add.rectangle(startX, y + 34, index === 0 ? 88 : 0, 2, 0x78dfd3, 0.95).setOrigin(0, 0.5);

      const hit = this.add.rectangle(startX - 12, y - 8, 240, 40, 0x000000, 0.001).setOrigin(0, 0);
      hit.setInteractive({ useHandCursor: true });

      const container = this.add.container(0, 0, [hit, label, underline]);

      hit.on("pointerover", () => this.highlightEntry(index));
      hit.on("pointerout", () => this.highlightEntry(this.getSelectedIndex()));
      hit.on("pointerdown", () => {
        if (index === 0) {
          this.scene.start("Game");
        }
      });

      this.entries.push({ container, label, underline, hit });
    });

    this.highlightEntry(0);
  }

  private createFooterHint() {
    this.add.text(38, this.scale.height - 64, "Menu conceitual. Background definitivo sera definido depois.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#6f8b90"
    });
  }

  private highlightEntry(activeIndex: number) {
    this.entries.forEach((entry, index) => {
      const isActive = index === activeIndex;
      entry.label.setColor(isActive ? "#f2fbfb" : "#c4d2d4");
      entry.label.setAlpha(isActive ? 1 : index === 0 ? 0.9 : 0.72);
      entry.underline.setDisplaySize(isActive ? 92 : 0.001, 2);
      entry.hit.input!.cursor = index === 0 ? "pointer" : "default";
    });
  }

  private getSelectedIndex() {
    return 0;
  }
}
