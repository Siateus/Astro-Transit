import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { buildRegions, Region } from "../models/Region";
import StarObject3D from "../objects/Star";
import StarlaneObject from "../objects/Starlane";
import { GalaxyBackgroundRenderer } from "../renderers/GalaxyBackgroundRenderer";
import { OperationsHudRenderer } from "../renderers/OperationsHudRenderer";
import {
  advanceSimulationDay,
  buildStarGraph,
  createInitialCompanyState,
  dispatchContract,
  seedInitialContracts,
  StarGraph
} from "../simulation/AstroTransitSimulation";
import { CompanyState } from "../types/AstroTransit";
import { GalaxyVisualConfig, ProjectedStar } from "../types/GalaxyVisual";
import { MapData, Star } from "../types/MapData";
import { GameConfig } from "../utils/GameConfig";
import { UIStyle } from "../utils/UIStyle";

export class Game extends Phaser.Scene {
  private mapData!: MapData;
  private graph!: StarGraph;
  private companyState!: CompanyState;
  private starsById = new Map<number, Star>();
  private regions: Region[] = [];
  private regionsById = new Map<string, Region>();
  private regionsBySystemId = new Map<number, Region>();
  private visualConfig!: GalaxyVisualConfig;
  private starRenderer!: StarObject3D;
  private laneRenderer!: StarlaneObject;
  private routeRenderer!: Phaser.GameObjects.Graphics;
  private shipRenderer!: Phaser.GameObjects.Graphics;
  private focusLabel!: Phaser.GameObjects.Text;
  private projectedStars = new Map<number, ProjectedStar>();
  private backgroundLayer!: Phaser.GameObjects.Container;
  private hyperlaneLayer!: Phaser.GameObjects.Container;
  private routeLayer!: Phaser.GameObjects.Container;
  private starLayer!: Phaser.GameObjects.Container;
  private shipLayer!: Phaser.GameObjects.Container;
  private labelLayer!: Phaser.GameObjects.Container;
  private selectionLayer!: Phaser.GameObjects.Container;
  private hudLayer!: Phaser.GameObjects.Container;
  private backgroundRenderer!: GalaxyBackgroundRenderer;
  private hudRenderer!: OperationsHudRenderer;
  private selectionGraphics!: Phaser.GameObjects.Graphics;
  private baseScale = 1;
  private viewScale = 1;
  private maxDepth = 1;
  private cameraOffsetX = 0;
  private cameraOffsetY = 0;
  private pitch = Phaser.Math.DegToRad(GameConfig.DEFAULT_CAMERA_PITCH_DEG);
  private isDragging = false;
  private isCameraMoving = false;
  private dragDistance = 0;
  private lastX = 0;
  private lastY = 0;
  private lastFastRenderAt = 0;
  private detailRenderTimer?: Phaser.Time.TimerEvent;
  private hoveredStarId: number | null = null;
  private selectedStarId: number | null = null;

  constructor() {
    super("Game");
  }

  create() {
    this.cameras.main.setBackgroundColor(UIStyle.PALETTE.BACKGROUND_DEEP_SPACE);
    const rawMapData = this.cache.json.get("mapa") as MapData;
    this.mapData = {
      ...rawMapData,
      stars: rawMapData.stars.map((star) => ({ ...star, z: star.z ?? 0 }))
    };
    this.mapData.stars.forEach((star) => {
      this.starsById.set(star.id, star);
    });
    this.buildRegionIndexes();
    this.graph = buildStarGraph(this.mapData.lanes);
    this.companyState = createInitialCompanyState(this.mapData);
    seedInitialContracts(this.companyState, this.mapData, this.graph, this.regionsBySystemId);

    this.visualConfig = {
      backgroundStarCount: GameConfig.BACKGROUND_STAR_COUNT,
      galaxyCloudCount: 0,
      dustCloudCount: 0,
      territoryPadding: 0,
      territoryAlpha: 0,
      laneAlpha: GameConfig.LANE_ALPHA,
      laneWidth: GameConfig.LANE_WIDTH,
      glowStrength: GameConfig.GLOW_STRENGTH,
      labelRules: []
    };

    this.baseScale = this.calculateInitialScale();
    this.viewScale = this.baseScale;
    this.maxDepth = this.calculateMaxDepth();

    this.createLayers();
    this.backgroundRenderer = new GalaxyBackgroundRenderer(this, this.backgroundLayer);
    this.backgroundRenderer.render(this.scale.width, this.scale.height, this.visualConfig);

    this.laneRenderer = new StarlaneObject(this, undefined, this.hyperlaneLayer);
    this.starRenderer = new StarObject3D(this, this.starLayer);
    this.routeRenderer = this.add.graphics();
    this.routeLayer.add(this.routeRenderer);
    this.shipRenderer = this.add.graphics();
    this.shipLayer.add(this.shipRenderer);
    this.selectionGraphics = this.add.graphics();
    this.selectionLayer.add(this.selectionGraphics);
    this.createFocusLabel();

    this.hudRenderer = new OperationsHudRenderer(this, this.hudLayer);
    this.renderMap(true);
    this.renderHud();
    this.setupInput();

    this.time.addEvent({
      delay: GameConfig.TICK_INTERVAL_MS,
      loop: true,
      callback: () => {
        advanceSimulationDay(this.companyState, this.mapData.stars, this.graph, this.regionsBySystemId);
        this.renderHud();
        this.requestMapRender(true);
      }
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, delta: number) {
    const pointer = this.input.activePointer;
    const width = this.scale.width;
    const height = this.scale.height;
    if (pointer.x < 0 || pointer.x > width || pointer.y < 0 || pointer.y > height) {
      return;
    }

    let moved = false;
    if (!this.isDragging) {
      const margin = GameConfig.EDGE_PAN_MARGIN;
      const panDistance = GameConfig.EDGE_PAN_SPEED * (delta / 1000);

      if (pointer.x <= margin) {
        this.cameraOffsetX += panDistance;
        moved = true;
      } else if (pointer.x >= width - margin) {
        this.cameraOffsetX -= panDistance;
        moved = true;
      }

      if (pointer.y <= margin) {
        this.cameraOffsetY += panDistance;
        moved = true;
      } else if (pointer.y >= height - margin) {
        this.cameraOffsetY -= panDistance;
        moved = true;
      }
    }

    if (moved) {
      this.clampCameraOffset();
      this.requestMapRender(false);
      return;
    }

    if (this.isCameraMoving) {
      return;
    }

    const previousHoveredStarId = this.hoveredStarId;
    const hoveredStarId = this.findHoveredStar(pointer.x, pointer.y);
    if (hoveredStarId !== this.hoveredStarId) {
      this.hoveredStarId = hoveredStarId;
      this.renderFocusState(previousHoveredStarId, this.hoveredStarId, this.selectedStarId);
    }
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        this.dragDistance = 0;
        this.lastX = pointer.x;
        this.lastY = pointer.y;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        return;
      }

      const deltaX = pointer.x - this.lastX;
      const deltaY = pointer.y - this.lastY;
      this.lastX = pointer.x;
      this.lastY = pointer.y;
      this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

      this.cameraOffsetX += deltaX * GameConfig.DRAG_PAN_SPEED;
      this.pitch = Phaser.Math.Clamp(
        this.pitch - deltaY * GameConfig.CAMERA_ROTATION_SPEED,
        Phaser.Math.DegToRad(GameConfig.MIN_CAMERA_PITCH_DEG),
        Phaser.Math.DegToRad(GameConfig.MAX_CAMERA_PITCH_DEG)
      );
      this.clampCameraOffset();
      this.requestMapRender(false);
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      if (pointer.leftButtonReleased() && this.dragDistance < 8) {
        const previousSelectedStarId = this.selectedStarId;
        this.selectedStarId = this.hoveredStarId;
        this.renderFocusState(previousSelectedStarId, this.selectedStarId, this.hoveredStarId);
        this.renderHud();
      } else {
        this.requestMapRender(true);
      }
    });

    this.input.on(
      "wheel",
      (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
        const zoomFactor = deltaY > 0 ? 1 - GameConfig.ZOOM_STEP : 1 + GameConfig.ZOOM_STEP;
        this.viewScale = Phaser.Math.Clamp(
          this.viewScale * zoomFactor,
          this.baseScale * GameConfig.MIN_SCALE,
          this.baseScale * GameConfig.MAX_SCALE
        );
        this.clampCameraOffset();
        this.requestMapRender(false);
      }
    );
  }

  private renderHud() {
    const selectedStar = this.selectedStarId !== null ? this.starsById.get(this.selectedStarId) ?? null : null;
    const selectedRegion = selectedStar ? this.regionsBySystemId.get(selectedStar.id) ?? null : null;
    const contracts = selectedStar
      ? this.companyState.availableContracts.filter((contract) => contract.originStarId === selectedStar.id).slice(0, 4)
      : [];

    this.hudRenderer.render(
      this.companyState,
      selectedStar,
      selectedRegion,
      contracts,
      this.starsById,
      this.regionsById,
      (contractId) => {
        const result = dispatchContract(this.companyState, contractId, this.mapData.stars, this.graph, this.regionsBySystemId);
        if (!result.ok) {
          this.companyState.alerts = [result.message];
        }
        this.renderHud();
        this.requestMapRender(true);
      }
    );
  }

  private renderMap(fullRender: boolean) {
    this.projectedStars.clear();
    const zoomRatio = this.viewScale / this.baseScale;
    this.renderStars();
    this.renderHyperlanes(zoomRatio);
    this.renderShipRoutes();
    this.renderShips();
    this.renderFocusLabel(fullRender);
    this.renderSelection();
  }

  private renderFocusState(previousId: number | null, nextId: number | null, selectedId: number | null) {
    if (previousId === nextId && nextId === selectedId) {
      return;
    }

    this.renderStars();
    this.renderShips();
    this.renderFocusLabel(true);
    this.renderSelection();
  }

  private renderHyperlanes(zoomRatio: number) {
    this.laneRenderer.beginFrame();
    this.mapData.lanes.forEach((lane) => {
      const from = this.projectedStars.get(lane.from);
      const to = this.projectedStars.get(lane.to);
      if (!from || !to) {
        return;
      }

      const alpha = Math.min(from.alpha, to.alpha) * (this.visualConfig.laneAlpha + Math.min(zoomRatio * 0.08, 0.14));
      const laneColor = from.regionId && from.regionId === to.regionId
        ? this.regionsById.get(from.regionId)?.colorHex ?? UIStyle.PALETTE.CONNECTION_LINE
        : UIStyle.PALETTE.CONNECTION_LINE;
      this.laneRenderer.renderBetween(
        { x: from.screenX, y: from.screenY },
        { x: to.screenX, y: to.screenY },
        alpha,
        this.visualConfig.laneWidth + Math.min(zoomRatio * 0.12, 0.6),
        laneColor
      );
    });
  }

  private renderShipRoutes() {
    this.routeRenderer.clear();
    this.routeRenderer.lineStyle(2, 0x5ed4c6, 0.75);
    this.companyState.fleet.forEach((ship) => {
      if (!ship.task) {
        return;
      }

      const points = ship.task.path
        .map((starId) => this.projectedStars.get(starId))
        .filter((star): star is ProjectedStar => Boolean(star));

      if (points.length < 2) {
        return;
      }

      this.routeRenderer.beginPath();
      this.routeRenderer.moveTo(points[0].screenX, points[0].screenY);
      points.slice(1).forEach((point) => {
        this.routeRenderer.lineTo(point.screenX, point.screenY);
      });
      this.routeRenderer.strokePath();
    });
  }

  private renderShips() {
    this.shipRenderer.clear();
    this.companyState.fleet.forEach((ship) => {
      const anchorStarId = ship.task ? ship.task.destinationStarId : ship.currentStarId;
      const projected = this.projectedStars.get(anchorStarId);
      if (!projected) {
        return;
      }

      const color = ship.status === "traveling" ? 0x64f0d3 : ship.status === "damaged" ? 0xffc36b : 0xdaf9ff;
      this.shipRenderer.fillStyle(color, 0.95);
      this.shipRenderer.fillTriangle(
        projected.screenX,
        projected.screenY - 8,
        projected.screenX - 5,
        projected.screenY + 5,
        projected.screenX + 5,
        projected.screenY + 5
      );
    });
  }

  private renderStars() {
    this.starRenderer.beginFrame();
    this.baseStars().forEach((star) => {
      const projection = this.projectStar(star);
      this.projectedStars.set(star.id, projection);
      const highlighted = projection.id === this.hoveredStarId || projection.id === this.selectedStarId;
      const region = this.regionsBySystemId.get(star.id);
      this.starRenderer.renderAt(
        star,
        projection.screenX,
        projection.screenY,
        projection.radius,
        projection.alpha,
        this.visualConfig.glowStrength,
        highlighted,
        region?.colorHex,
        projection.isCapital
      );
    });
  }

  private projectStar(star: Star): ProjectedStar {
    const rotatedStar = this.rotateStar(star);
    const depth = rotatedStar.z ?? 0;
    const normalizedDepth = Phaser.Math.Clamp((depth + this.maxDepth) / (2 * this.maxDepth), 0.25, 1);
    const importance = Phaser.Math.Clamp((Math.abs(star.x) + Math.abs(star.y)) / this.maxDepth, 0.2, 1);
    const radius = Phaser.Math.Linear(1.8, 3.8, importance) * Phaser.Math.Linear(0.86, 1.4, normalizedDepth);
    const region = this.regionsBySystemId.get(star.id);

    return {
      id: star.id,
      star,
      name: star.name ?? `Sistema ${star.id}`,
      screenX: this.getViewCenterX() + rotatedStar.x * this.viewScale,
      screenY: this.getViewCenterY() - rotatedStar.y * this.viewScale,
      alpha: normalizedDepth,
      radius,
      importance,
      isCapital: region?.capitalSystemId === star.id,
      regionId: region?.id
    };
  }

  private rotateStar(star: Star): Star {
    const pitchSin = Math.sin(this.pitch);
    const pitchCos = Math.cos(this.pitch);
    const pitchY = star.y * pitchCos + (star.z ?? 0) * pitchSin;
    const pitchZ = (star.z ?? 0) * pitchCos - star.y * pitchSin;

    return {
      ...star,
      x: star.x,
      y: pitchY,
      z: pitchZ
    };
  }

  private getViewCenterX() {
    return (this.scale.width / 2) + this.cameraOffsetX;
  }

  private getViewCenterY() {
    return (this.scale.height / 2) + this.cameraOffsetY;
  }

  private calculateInitialScale() {
    const stars = this.baseStars();
    const maxX = Math.max(...stars.map((star) => Math.abs(star.x)), 1);
    const maxY = Math.max(...stars.map((star) => Math.abs(star.y)), 1);
    return Math.min((this.scale.width * 0.42) / maxX, (this.scale.height * 0.4) / maxY);
  }

  private calculateMaxDepth() {
    return Math.max(
      ...this.baseStars().map((star) => Math.max(Math.abs(star.x), Math.abs(star.y), Math.abs(star.z ?? 0))),
      1
    );
  }

  private clampCameraOffset() {
    const horizontalReach = this.getProjectedHalfSpan("x");
    const verticalReach = this.getProjectedHalfSpan("y");
    const minOffsetX = this.scale.width * GameConfig.EDGE_PAN_MIN_OFFSET_SCREEN_FRACTION;
    const minOffsetY = this.scale.height * GameConfig.EDGE_PAN_MIN_OFFSET_SCREEN_FRACTION;
    const maxOffsetX = Math.max(horizontalReach - (this.scale.width / 2), minOffsetX);
    const maxOffsetY = Math.max(verticalReach - (this.scale.height / 2), minOffsetY);

    this.cameraOffsetX = Phaser.Math.Clamp(this.cameraOffsetX, -maxOffsetX, maxOffsetX);
    this.cameraOffsetY = Phaser.Math.Clamp(this.cameraOffsetY, -maxOffsetY, maxOffsetY);
  }

  private getProjectedHalfSpan(axis: "x" | "y") {
    return Math.max(
      ...this.baseStars().map((star) => {
        const rotatedStar = this.rotateStar(star);
        return Math.abs(axis === "x" ? rotatedStar.x : rotatedStar.y) * this.viewScale;
      }),
      1
    );
  }

  private createLayers() {
    this.backgroundLayer = this.add.container(0, 0).setDepth(0);
    this.hyperlaneLayer = this.add.container(0, 0).setDepth(20);
    this.routeLayer = this.add.container(0, 0).setDepth(24);
    this.starLayer = this.add.container(0, 0).setDepth(30);
    this.shipLayer = this.add.container(0, 0).setDepth(34);
    this.labelLayer = this.add.container(0, 0).setDepth(40);
    this.selectionLayer = this.add.container(0, 0).setDepth(50);
    this.hudLayer = this.add.container(0, 0).setDepth(100);
  }

  private createFocusLabel() {
    this.focusLabel = this.add.text(0, 0, "", {
      ...(UIStyle.TYPOGRAPHY.PRESET.STAR_LABEL as Phaser.Types.GameObjects.Text.TextStyle),
      fontSize: 12,
      color: UIStyle.PALETTE.LABEL_BRIGHT,
      shadow: {
        color: "#000000",
        blur: 8,
        fill: true,
        stroke: false,
        offsetX: 0,
        offsetY: 0
      }
    }).setOrigin(0.5, 1);
    this.focusLabel.setVisible(false);
    this.labelLayer.add(this.focusLabel);
  }

  private renderFocusLabel(show: boolean) {
    if (!show || this.isCameraMoving) {
      this.focusLabel.setVisible(false);
      return;
    }

    const activeId = this.selectedStarId ?? this.hoveredStarId;
    if (activeId === null) {
      this.focusLabel.setVisible(false);
      return;
    }

    const projected = this.projectedStars.get(activeId);
    if (!projected || !this.isProjectedStarVisible(projected)) {
      this.focusLabel.setVisible(false);
      return;
    }

    this.focusLabel.setVisible(true);
    this.focusLabel.setText(projected.name);
    this.focusLabel.setPosition(projected.screenX, projected.screenY - (projected.radius * 3.4));
  }

  private renderSelection() {
    this.selectionGraphics.clear();
    const activeId = this.selectedStarId ?? this.hoveredStarId;
    if (activeId === null) {
      return;
    }

    const projected = this.projectedStars.get(activeId);
    if (!projected) {
      return;
    }

    this.selectionGraphics.lineStyle(1.5, UIStyle.PALETTE.STELLAR_GLOW, 0.75);
    this.selectionGraphics.strokeCircle(projected.screenX, projected.screenY, projected.radius * 3.1);
    this.selectionGraphics.lineStyle(1, UIStyle.PALETTE.STELLAR_GLOW, 0.24);
    this.selectionGraphics.strokeCircle(projected.screenX, projected.screenY, projected.radius * 4.6);
  }

  private findHoveredStar(pointerX: number, pointerY: number) {
    let closestId: number | null = null;
    let smallestDistance = GameConfig.HOVER_PICK_RADIUS;

    this.projectedStars.forEach((projected) => {
      const distance = Phaser.Math.Distance.Between(pointerX, pointerY, projected.screenX, projected.screenY);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestId = projected.id;
      }
    });

    return closestId;
  }

  private isProjectedStarVisible(projected: ProjectedStar) {
    return projected.screenX >= -32
      && projected.screenX <= this.scale.width + 32
      && projected.screenY >= -32
      && projected.screenY <= this.scale.height + 32;
  }

  private requestMapRender(fullRender: boolean) {
    if (fullRender) {
      this.isCameraMoving = false;
      this.detailRenderTimer?.remove(false);
      this.detailRenderTimer = undefined;
      this.renderMap(true);
      return;
    }

    this.isCameraMoving = true;
    const now = this.time.now;
    if ((now - this.lastFastRenderAt) >= GameConfig.FAST_RENDER_MIN_INTERVAL_MS) {
      this.lastFastRenderAt = now;
      this.renderMap(false);
    }

    this.detailRenderTimer?.remove(false);
    this.detailRenderTimer = this.time.delayedCall(GameConfig.DETAIL_RENDER_IDLE_MS, () => {
      this.isCameraMoving = false;
      this.renderMap(true);
      this.detailRenderTimer = undefined;
    });
  }

  private baseStars() {
    return [...this.starsById.values()];
  }

  private buildRegionIndexes() {
    this.regions = buildRegions(this.mapData);
    this.regionsById.clear();
    this.regionsBySystemId.clear();

    this.regions.forEach((region) => {
      this.regionsById.set(region.id, region);
      region.systemIds.forEach((systemId) => {
        const star = this.starsById.get(systemId);
        if (!star) {
          return;
        }

        star.regionId = region.id;
        this.regionsBySystemId.set(systemId, region);
      });
    });
  }
}
