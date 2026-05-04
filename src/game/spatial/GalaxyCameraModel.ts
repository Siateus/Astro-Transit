import Phaser from "phaser";
import { Star } from "../types/MapData";
import { GameConfig } from "../utils/GameConfig";
import {
  calculateInitialScale,
  calculateMaxDepth,
  clampCameraOffset,
  type CameraViewState
} from "./GalaxyProjection";

interface GalaxyCameraModelOptions {
  stars: Star[];
  width: number;
  height: number;
}

export class GalaxyCameraModel {
  private readonly stars: Star[];
  private readonly baseScale: number;
  private readonly maxDepth: number;
  private viewScale: number;
  private cameraOffsetX = 0;
  private cameraOffsetY = 0;
  private pitch = Phaser.Math.DegToRad(GameConfig.DEFAULT_CAMERA_PITCH_DEG);
  private width: number;
  private height: number;

  constructor(options: GalaxyCameraModelOptions) {
    this.stars = options.stars;
    this.width = options.width;
    this.height = options.height;
    this.baseScale = calculateInitialScale(options.stars, options.width, options.height);
    this.maxDepth = calculateMaxDepth(options.stars);
    this.viewScale = this.baseScale;
  }

  setViewport(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.applyClamp();
  }

  pan(deltaX: number, deltaY: number) {
    this.cameraOffsetX += deltaX;
    this.cameraOffsetY += deltaY;
    this.applyClamp();
  }

  rotate(deltaPitch: number) {
    this.pitch = Phaser.Math.Clamp(
      this.pitch + deltaPitch,
      Phaser.Math.DegToRad(GameConfig.MIN_CAMERA_PITCH_DEG),
      Phaser.Math.DegToRad(GameConfig.MAX_CAMERA_PITCH_DEG)
    );
    this.applyClamp();
  }

  zoom(deltaY: number) {
    const zoomFactor = deltaY > 0 ? 1 - GameConfig.ZOOM_STEP : 1 + GameConfig.ZOOM_STEP;
    this.viewScale = Phaser.Math.Clamp(
      this.viewScale * zoomFactor,
      this.baseScale * GameConfig.MIN_SCALE,
      this.baseScale * GameConfig.MAX_SCALE
    );
    this.applyClamp();
  }

  getViewState(): CameraViewState {
    return {
      width: this.width,
      height: this.height,
      viewScale: this.viewScale,
      baseScale: this.baseScale,
      maxDepth: this.maxDepth,
      cameraOffsetX: this.cameraOffsetX,
      cameraOffsetY: this.cameraOffsetY,
      pitch: this.pitch
    };
  }

  getZoomRatio() {
    return this.viewScale / this.baseScale;
  }

  private applyClamp() {
    const clampedOffset = clampCameraOffset(
      this.stars,
      this.getViewState(),
      GameConfig.EDGE_PAN_MIN_OFFSET_SCREEN_FRACTION
    );
    this.cameraOffsetX = clampedOffset.x;
    this.cameraOffsetY = clampedOffset.y;
  }
}

export function createGalaxyCameraModel(options: GalaxyCameraModelOptions) {
  return new GalaxyCameraModel(options);
}
