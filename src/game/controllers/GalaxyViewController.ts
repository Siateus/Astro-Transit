import Phaser from "phaser";
import { GalaxyCameraModel } from "../spatial/GalaxyCameraModel";
import { type CameraViewState } from "../spatial/GalaxyProjection";
import { GameConfig } from "../utils/GameConfig";

interface ControllerOptions {
  camera: GalaxyCameraModel;
}

export class GalaxyViewController {
  private readonly scene: Phaser.Scene;
  private readonly camera: GalaxyCameraModel;
  private isDragging = false;
  private isCameraMoving = false;
  private dragDistance = 0;
  private lastX = 0;
  private lastY = 0;
  private lastFastRenderAt = 0;
  private detailRenderTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, options: ControllerOptions) {
    this.scene = scene;
    this.camera = options.camera;
  }

  update(pointer: Phaser.Input.Pointer, delta: number) {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.camera.setViewport(width, height);

    if (pointer.x < 0 || pointer.x > width || pointer.y < 0 || pointer.y > height) {
      return { moved: false, shouldSkipHover: false };
    }

    if (this.isDragging) {
      return { moved: false, shouldSkipHover: this.isCameraMoving };
    }

    const moved = this.applyEdgePan(pointer, delta);
    return { moved, shouldSkipHover: this.isCameraMoving };
  }

  beginDrag(pointer: Phaser.Input.Pointer) {
    if (!pointer.leftButtonDown()) {
      return;
    }

    this.isDragging = true;
    this.dragDistance = 0;
    this.lastX = pointer.x;
    this.lastY = pointer.y;
  }

  drag(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) {
      return false;
    }

    const deltaX = pointer.x - this.lastX;
    const deltaY = pointer.y - this.lastY;
    this.lastX = pointer.x;
    this.lastY = pointer.y;
    this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

    this.camera.pan(deltaX * GameConfig.DRAG_PAN_SPEED, 0);
    this.camera.rotate(-deltaY * GameConfig.CAMERA_ROTATION_SPEED);
    return true;
  }

  endDrag(pointer: Phaser.Input.Pointer) {
    const wasClick = pointer.leftButtonReleased() && this.dragDistance < 8;
    this.isDragging = false;
    return { wasClick };
  }

  zoom(deltaY: number) {
    this.camera.zoom(deltaY);
  }

  requestRender(fullRender: boolean, renderMap: (fullRender: boolean) => void) {
    if (fullRender) {
      this.isCameraMoving = false;
      this.detailRenderTimer?.remove(false);
      this.detailRenderTimer = undefined;
      renderMap(true);
      return;
    }

    this.isCameraMoving = true;
    const now = this.scene.time.now;
    if ((now - this.lastFastRenderAt) >= GameConfig.FAST_RENDER_MIN_INTERVAL_MS) {
      this.lastFastRenderAt = now;
      renderMap(false);
    }

    this.detailRenderTimer?.remove(false);
    this.detailRenderTimer = this.scene.time.delayedCall(GameConfig.DETAIL_RENDER_IDLE_MS, () => {
      this.isCameraMoving = false;
      renderMap(true);
      this.detailRenderTimer = undefined;
    });
  }

  getViewState(): CameraViewState {
    this.camera.setViewport(this.scene.scale.width, this.scene.scale.height);
    return this.camera.getViewState();
  }

  getZoomRatio() {
    return this.camera.getZoomRatio();
  }

  isMoving() {
    return this.isCameraMoving;
  }

  private applyEdgePan(pointer: Phaser.Input.Pointer, delta: number) {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const margin = GameConfig.EDGE_PAN_MARGIN;
    const panDistance = GameConfig.EDGE_PAN_SPEED * (delta / 1000);
    let moved = false;

    if (pointer.x <= margin) {
      this.camera.pan(panDistance, 0);
      moved = true;
    } else if (pointer.x >= width - margin) {
      this.camera.pan(-panDistance, 0);
      moved = true;
    }

    if (pointer.y <= margin) {
      this.camera.pan(0, panDistance);
      moved = true;
    } else if (pointer.y >= height - margin) {
      this.camera.pan(0, -panDistance);
      moved = true;
    }

    return moved;
  }
}
