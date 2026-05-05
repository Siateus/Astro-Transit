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
import { RoutePreview } from "../session/GameSession";
import { setupGameSceneVisuals } from "./setupGameSceneVisuals";
import { GameAssetKeys } from "../utils/GameAssets";

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
  private mapMode: "political" | "risk" = "political";
  private mapModeButton?: Phaser.GameObjects.Image;
  private mapModeLabel?: Phaser.GameObjects.Text;
  private routePreview: RoutePreview | null = null;
  private crisisBanner?: Phaser.GameObjects.Container;
  private crisisBannerBg?: Phaser.GameObjects.Rectangle;
  private crisisBannerText?: Phaser.GameObjects.Text;
  private sosBadge?: Phaser.GameObjects.Container;

  constructor() {
    super("Game");
  }

  create(data?: { mode?: "new" | "continue" }) {
    this.cameras.main.setBackgroundColor(UIStyle.PALETTE.BACKGROUND_DEEP_SPACE);
    const rawMapData = this.cache.json.get("mapa") as MapData;
    this.session = new GameSession(rawMapData, data?.mode ?? "new");

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
    this.createMapModeControl();
    this.createCrisisOverlays();
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
    if (this.routePreview) {
      this.requestMapRender(false);
    }
    this.updateCrisisOverlays();
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

    this.input.keyboard?.on("keydown-M", () => this.toggleMapMode());
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
      (shipId, action) => {
        const selectedStarId = this.interactionController.getSelectedStarId();
        const result = action === "relocate" && selectedStarId !== null
          ? this.session.relocateShip(shipId, selectedStarId)
          : this.session.startShipMaintenance(shipId);
        if (!result.ok) {
          this.session.companyState.alerts = [result.message];
        }
        this.renderHud();
        this.requestMapRender(true);
      },
      (contractId) => {
        this.routePreview = contractId ? this.session.getRoutePreview(contractId) : null;
        this.requestMapRender(true);
      },
      (shipTypeId) => {
        const selectedStarId = this.interactionController.getSelectedStarId();
        const result = this.session.purchaseShip(shipTypeId, selectedStarId ?? undefined);
        if (!result.ok) {
          this.session.companyState.alerts = [result.message];
        }
        this.renderHud();
        this.requestMapRender(true);
      },
      () => {
        this.session.cycleContractFilter();
        this.renderHud();
      }
    );
    this.updateCrisisOverlays();
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
      zoomRatio,
      this.mapMode
    );
    this.overlayRenderer.renderShipRoutes(this.session.companyState, this.projectedStars);
    if (this.routePreview) {
      this.overlayRenderer.renderRoutePreview(
        this.routePreview.path,
        this.routePreview.risk,
        this.projectedStars,
        1 + Math.sin(this.time.now / 130)
      );
    } else {
      this.overlayRenderer.renderRoutePreview([], 0, this.projectedStars);
    }
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
      lookup: this.session.lookup,
      mapMode: this.mapMode
    });
  }

  private createMapModeControl() {
    this.mapModeButton = this.add.image(this.scale.width - 196, 36, GameAssetKeys.uiButtonBar).setOrigin(0, 0).setDisplaySize(168, 22).setDepth(120);
    this.mapModeLabel = this.add.text(this.scale.width - 112, 47, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "10px",
      color: "#d8fffb"
    }).setOrigin(0.5).setDepth(121);

    this.mapModeButton.setInteractive({ useHandCursor: true });
    this.mapModeLabel.setInteractive({ useHandCursor: true });
    [this.mapModeButton, this.mapModeLabel].forEach((target) => {
      target.on("pointerdown", () => this.toggleMapMode());
      target.on("pointerover", () => this.mapModeButton?.setAlpha(1));
      target.on("pointerout", () => this.mapModeButton?.setAlpha(0.88));
    });

    this.updateMapModeControl();
  }

  private toggleMapMode() {
    this.mapMode = this.mapMode === "political" ? "risk" : "political";
    this.updateMapModeControl();
    this.requestMapRender(true);
  }

  private updateMapModeControl() {
    this.mapModeButton?.setTexture(this.mapMode === "risk" ? GameAssetKeys.uiButtonBarActive : GameAssetKeys.uiButtonBar).setAlpha(0.88);
    this.mapModeLabel?.setText(this.mapMode === "risk" ? "CAMADA: RISCO" : "CAMADA: POLITICA");
  }

  private createCrisisOverlays() {
    const crisisBg = this.add.rectangle(this.scale.width / 2, 86, this.scale.width - 80, 42, 0x5c1218, 0.86);
    const crisisText = this.add.text(this.scale.width / 2, 86, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.crisisBanner = this.add.container(0, 0, [crisisBg, crisisText]).setDepth(130).setVisible(false);
    this.crisisBannerBg = crisisBg;
    this.crisisBannerText = crisisText;

    const sosBg = this.add.rectangle(this.scale.width - 68, 92, 88, 32, 0x7b1118, 0.92);
    const sosText = this.add.text(this.scale.width - 68, 92, "SOS", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    [sosBg, sosText].forEach((target) => {
      target.setInteractive({ useHandCursor: true });
      target.on("pointerdown", () => this.rescueFirstStrandedShip());
    });
    this.sosBadge = this.add.container(0, 0, [sosBg, sosText]).setDepth(132).setVisible(false);
  }

  private updateCrisisOverlays() {
    const state = this.session.companyState;
    const hasDebt = state.credits < 0;
    this.crisisBanner?.setVisible(hasDebt);
    if (hasDebt) {
      const remainingDays = Math.max(0, GameConfig.MAX_DEBT_DAYS - state.debtDays);
      this.crisisBannerText?.setText(`${remainingDays} DIAS PARA O CONFISCO DA FROTA`);
      this.crisisBannerBg?.setAlpha(0.62 + (Math.sin(this.time.now / 120) * 0.22));
    }

    this.sosBadge?.setVisible(state.fleet.some((ship) => ship.status === "stranded"));
  }

  private rescueFirstStrandedShip() {
    const strandedShip = this.session.companyState.fleet.find((ship) => ship.status === "stranded");
    if (!strandedShip) {
      return;
    }

    const result = this.session.startShipMaintenance(strandedShip.id);
    if (!result.ok) {
      this.session.companyState.alerts = [result.message];
    }
    this.renderHud();
    this.requestMapRender(true);
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
    this.crisisBanner?.setVisible(true);
    this.crisisBannerText?.setText("CONFISCO DA FROTA AUTORIZADO");
    this.cameras.main.fadeOut(900, 120, 0, 16);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("GameOver", { razao: "Falência Operacional" });
    });
    return true;
  }
}
