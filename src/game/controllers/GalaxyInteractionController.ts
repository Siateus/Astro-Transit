import Phaser from "phaser";
import { GalaxyFocusController } from "./GalaxyFocusController";
import { GalaxyViewController } from "./GalaxyViewController";
import { GalaxyCameraModel } from "../spatial/GalaxyCameraModel";

interface InteractionControllerOptions {
  camera: GalaxyCameraModel;
  renderMap: (fullRender: boolean) => void;
  renderFocusState: () => void;
  renderHud: () => void;
  pickHoveredStarId: (pointer: Phaser.Input.Pointer) => number | null;
}

export class GalaxyInteractionController {
  private readonly focusController = new GalaxyFocusController();
  private readonly viewController: GalaxyViewController;
  private readonly renderMap: (fullRender: boolean) => void;
  private readonly renderFocusState: () => void;
  private readonly renderHud: () => void;
  private readonly pickHoveredStarId: (pointer: Phaser.Input.Pointer) => number | null;

  constructor(scene: Phaser.Scene, options: InteractionControllerOptions) {
    this.viewController = new GalaxyViewController(scene, { camera: options.camera });
    this.renderMap = options.renderMap;
    this.renderFocusState = options.renderFocusState;
    this.renderHud = options.renderHud;
    this.pickHoveredStarId = options.pickHoveredStarId;
  }

  update(pointer: Phaser.Input.Pointer, delta: number) {
    const { moved, shouldSkipHover } = this.viewController.update(pointer, delta);

    if (moved) {
      this.scheduleMapRender(false);
      return;
    }

    if (shouldSkipHover) {
      return;
    }

    const hoveredStarId = this.pickHoveredStarId(pointer);
    const focusState = this.focusController.updateHoveredStar(hoveredStarId);
    if (focusState.changed) {
      this.renderFocusState();
    }
  }

  beginDrag(pointer: Phaser.Input.Pointer) {
    this.viewController.beginDrag(pointer);
  }

  drag(pointer: Phaser.Input.Pointer) {
    if (!this.viewController.drag(pointer)) {
      return;
    }

    this.scheduleMapRender(false);
  }

  endDrag(pointer: Phaser.Input.Pointer) {
    const { wasClick } = this.viewController.endDrag(pointer);
    if (wasClick) {
      const focusState = this.focusController.selectHoveredStar();
      if (focusState.changed) {
        this.renderFocusState();
        this.renderHud();
      }
      return;
    }

    this.scheduleMapRender(true);
  }

  zoom(deltaY: number) {
    this.viewController.zoom(deltaY);
    this.scheduleMapRender(false);
  }

  requestMapRender(fullRender: boolean) {
    this.scheduleMapRender(fullRender);
  }

  getSelectedStarId() {
    return this.focusController.getSelectedStarId();
  }

  getActiveStarId() {
    return this.focusController.getActiveStarId();
  }

  getViewState() {
    return this.viewController.getViewState();
  }

  getZoomRatio() {
    return this.viewController.getZoomRatio();
  }

  isMoving() {
    return this.viewController.isMoving();
  }

  isHighlighted(starId: number) {
    return this.focusController.isHighlighted(starId);
  }

  private scheduleMapRender(fullRender: boolean) {
    this.viewController.requestRender(fullRender, (shouldRenderInDetail) => {
      this.renderMap(shouldRenderInDetail);
    });
  }
}
