import Phaser from "phaser";
import { Star } from "../types/MapData";

export default class StarObject3D extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene, parent?: Phaser.GameObjects.Container) {
    super(scene);
    scene.add.existing(this);
    parent?.add(this);
  }

  beginFrame() {
    this.clear();
  }

  renderAt(
    star: Star,
    screenX: number,
    screenY: number,
    radius: number,
    alpha: number,
    glowStrength: number,
    selected: boolean,
    regionColor?: number,
    capital = false
  ) {
    const colorHex = StarObject3D.getColorHex(star.color);
    if (regionColor !== undefined) {
      this.lineStyle(capital ? 1.8 : 0.9, regionColor, Math.min(alpha * (capital ? 0.72 : 0.42), 0.78));
      this.strokeCircle(screenX, screenY, radius * (capital ? 3.1 : 2.55));
    }

    this.fillStyle(colorHex, Math.min(alpha * 0.24 * glowStrength, 0.35));
    this.fillCircle(screenX, screenY, radius * 3.2);
    this.fillStyle(0xffffff, Math.min(alpha * 0.22 * glowStrength, 0.28));
    this.fillCircle(screenX, screenY, radius * 2.1);
    this.fillStyle(colorHex, Math.min(alpha * 0.85, 1));
    this.fillCircle(screenX, screenY, radius);
    this.fillStyle(0xffffff, Math.min(alpha, 1));
    this.fillCircle(screenX, screenY, Math.max(radius * 0.34, 1));

    if (selected) {
      this.lineStyle(1.2, 0xbef8f0, Math.min(alpha + 0.15, 1));
      this.strokeCircle(screenX, screenY, radius * 2.3);
    }
  }

  private static getColorHex(color: string): number {
    switch (color) {
      case "blue": return 0x00aaff;
      case "white": return 0xffffff;
      case "yellow": return 0xffdd00;
      case "red": return 0xff4444;
      case "orange": return 0xff8800;
      default: return 0xffffff;
    }
  }
}
