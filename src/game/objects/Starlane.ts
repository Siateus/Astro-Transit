import Phaser from "phaser";
import { Lane } from "../types/MapData";

export default class StarlaneObject extends Phaser.GameObjects.Graphics {
  public readonly lane: Lane;

  constructor(scene: Phaser.Scene, lane: Lane = { from: -1, to: -1 }, parent?: Phaser.GameObjects.Container) {
    super(scene);
    this.lane = lane;
    scene.add.existing(this);
    parent?.add(this);
  }

  beginFrame() {
    this.clear();
  }

  renderBetween(
    from: { x: number; y: number },
    to: { x: number; y: number },
    alpha: number,
    width: number,
    color: number
  ) {
    this.lineStyle(width, color, alpha);
    this.beginPath();
    this.moveTo(from.x, from.y);
    this.lineTo(to.x, to.y);
    this.strokePath();
  }
}
