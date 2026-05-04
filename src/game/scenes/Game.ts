import Phaser from "phaser";
import { GalaxyInteractionController } from "../controllers/GalaxyInteractionController";
import { EventBus } from "../EventBus";
import { GalaxyMapOverlayRenderer } from "../renderers/GalaxyMapOverlayRenderer";
import { GalaxyStarfieldRenderer } from "../renderers/GalaxyStarfieldRenderer";
import { OperationsHudRenderer } from "../renderers/OperationsHudRenderer";
import { createGalaxyCameraModel } from "../spatial/GalaxyCameraModel";
import { findHoveredStar } from "../spatial/GalaxyProjection";
import { GalaxyVisualConfig, ProjectedStar } from "../types/GalaxyVisual";
import { MapData } from "../types/MapData";
import { GameConfig } from "../utils/GameConfig";
import { UIStyle } from "../utils/UIStyle";
import { GameSession } from "../session/GameSession";
import { setupGameSceneVisuals } from "./setupGameSceneVisuals";

export class Game extends Phaser.Scene {
  private session!: GameSession;
  private visualConfig!: GalaxyVisualConfig;
  private starfieldRenderer!: GalaxyStarfieldRenderer;
  private projectedStars = new Map<number, ProjectedStar>();
  private overlayRenderer!: GalaxyMapOverlayRenderer;
  private hudRenderer!: OperationsHudRenderer;
  private interactionController!: GalaxyInteractionController;
  private timerLoop?: Phaser.Time.TimerEvent;
  private intervaloAtual: number = GameConfig.TICK_INTERVAL_MS;
  private transicaoGameOverIniciada = false;

  constructor() {
    super("Game");
  }

  create() {
    this.cameras.main.setBackgroundColor(UIStyle.PALETTE.BACKGROUND_DEEP_SPACE);
    const rawMapData = this.cache.json.get("mapa") as MapData;
    this.session = new GameSession(rawMapData);

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

    const camera = createGalaxyCameraModel({
      stars: this.session.stars,
      width: this.scale.width,
      height: this.scale.height
    });

    this.interactionController = new GalaxyInteractionController(this, {
      camera,
      renderMap: (fullRender) => this.renderMap(fullRender),
      renderFocusState: () => this.renderFocusState(),
      renderHud: () => this.renderHud(),
      pickHoveredStarId: (pointer) => findHoveredStar(
        this.projectedStars.values(),
        pointer.x,
        pointer.y,
        GameConfig.HOVER_PICK_RADIUS
      )
    });

    const visuals = setupGameSceneVisuals(this, this.visualConfig);
    this.starfieldRenderer = visuals.starfieldRenderer;
    this.overlayRenderer = visuals.overlayRenderer;
    this.hudRenderer = visuals.hudRenderer;

    this.renderMap(true);
    this.renderHud();
    this.setupInput();

    this.criarTimerLoop();

    EventBus.emit("current-scene-ready", this);
  }

  ajustarVelocidade(multiplicador: number) {
    if (multiplicador === 0) {
      if (this.timerLoop) {
        this.timerLoop.paused = true;
      }
      return;
    }

    if (![1, 2, 4].includes(multiplicador)) {
      return;
    }

    this.intervaloAtual = GameConfig.TICK_INTERVAL_MS / multiplicador;
    this.timerLoop?.remove(false);
    this.criarTimerLoop();
  }

  update(_time: number, delta: number) {
    this.verificarGameOver();
    if (this.transicaoGameOverIniciada) {
      return;
    }

    this.interactionController.update(this.input.activePointer, delta);
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.interactionController.beginDrag(pointer);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.interactionController.drag(pointer);
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      this.interactionController.endDrag(pointer);
    });

    this.input.on(
      "wheel",
      (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
        this.interactionController.zoom(deltaY);
      }
    );
  }

  private renderHud() {
    const viewModel = this.session.buildHudViewModel(this.interactionController.getSelectedStarId());

    this.hudRenderer.render(
      viewModel,
      (contractId) => {
        const result = this.session.dispatchContract(contractId);
        if (!result.ok) {
          this.session.companyState.alerts = [result.message];
        }
        this.renderHud();
        this.requestMapRender(true);
      },
      (shipId) => {
        const result = this.session.startShipMaintenance(shipId);
        if (!result.ok) {
          this.session.companyState.alerts = [result.message];
        }
        this.renderHud();
        this.requestMapRender(true);
      }
    );
  }

  private renderMap(fullRender: boolean) {
    this.renderStars();
    const zoomRatio = this.interactionController.getZoomRatio();
    this.overlayRenderer.renderHyperlanes(
      this.session.mapData.lanes,
      this.projectedStars,
      this.session.lookup,
      this.visualConfig.laneAlpha,
      this.visualConfig.laneWidth,
      zoomRatio
    );
    this.overlayRenderer.renderShipRoutes(this.session.companyState, this.projectedStars);
    this.overlayRenderer.renderShips(this.session.companyState, this.projectedStars);
    this.overlayRenderer.renderFocusLabel(
      this.interactionController.getActiveStarId(),
      this.projectedStars,
      this.interactionController.isMoving(),
      fullRender,
      this.scale.width,
      this.scale.height
    );
    this.overlayRenderer.renderSelection(this.interactionController.getActiveStarId(), this.projectedStars);
  }

  private renderFocusState() {
    this.renderStars();
    this.overlayRenderer.renderShips(this.session.companyState, this.projectedStars);
    this.overlayRenderer.renderFocusLabel(
      this.interactionController.getActiveStarId(),
      this.projectedStars,
      this.interactionController.isMoving(),
      true,
      this.scale.width,
      this.scale.height
    );
    this.overlayRenderer.renderSelection(this.interactionController.getActiveStarId(), this.projectedStars);
  }

  private renderStars() {
    this.projectedStars = this.starfieldRenderer.render({
      stars: this.session.stars,
      viewState: this.interactionController.getViewState(),
      glowStrength: this.visualConfig.glowStrength,
      isHighlighted: (starId) => this.interactionController.isHighlighted(starId),
      lookup: this.session.lookup
    });
  }

  private requestMapRender(fullRender: boolean) {
    this.interactionController.requestMapRender(fullRender);
  }

  private criarTimerLoop() {
    this.timerLoop = this.time.addEvent({
      delay: this.intervaloAtual,
      loop: true,
      callback: () => {
        this.session.advanceDay();
        if (this.verificarGameOver()) {
          return;
        }

        this.renderHud();
        this.requestMapRender(true);
      }
    });
  }

  private verificarGameOver() {
    if (this.transicaoGameOverIniciada || !this.session.companyState.gameOver) {
      return false;
    }

    this.transicaoGameOverIniciada = true;
    this.timerLoop?.remove(false);
    this.timerLoop = undefined;
    this.time.removeAllEvents();
    this.input.removeAllListeners();
    this.input.enabled = false;
    this.scene.start("GameOver", { razao: "Falência Operacional" });
    return true;
  }
}
