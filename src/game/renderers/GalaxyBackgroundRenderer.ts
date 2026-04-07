import Phaser from "phaser";
import { GalaxyVisualConfig } from "../types/GalaxyVisual";

export class GalaxyBackgroundRenderer {
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private readonly starfield: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container) {
    this.backdrop = scene.add.graphics();
    this.starfield = scene.add.graphics();
    root.add([this.backdrop, this.starfield]);
  }

  render(width: number, height: number, config: GalaxyVisualConfig) {
    const rng = new Phaser.Math.RandomDataGenerator(["galaxy-background"]);

    this.backdrop.clear();
    this.starfield.clear();

    this.backdrop.fillStyle(0x05070c, 1);
    this.backdrop.fillRect(0, 0, width, height);

    for (let index = 0; index < config.backgroundStarCount; index += 1) {
      const x = rng.between(0, width);
      const y = rng.between(0, height);
      const alpha = rng.realInRange(0.08, 0.55);
      const radius = rng.realInRange(0.5, 1.8);
      const color = rng.pick([0xcfd6da, 0xe6ecef, 0x9ebfd1, 0xf2efe8]);
      this.starfield.fillStyle(color, alpha);
      this.starfield.fillCircle(x, y, radius);
    }
  }
}
