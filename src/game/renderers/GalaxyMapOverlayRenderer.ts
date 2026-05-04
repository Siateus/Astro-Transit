import Phaser from "phaser";
import StarlaneObject from "../objects/Starlane";
import { CompanyState } from "../types/AstroTransit";
import { ProjectedStar } from "../types/GalaxyVisual";
import { Lane } from "../types/MapData";
import { UIStyle } from "../utils/UIStyle";
import { GameWorldLookup } from "../world/GameWorldLookup";

interface OverlayLayers {
  hyperlaneLayer: Phaser.GameObjects.Container;
  routeLayer: Phaser.GameObjects.Container;
  shipLayer: Phaser.GameObjects.Container;
  labelLayer: Phaser.GameObjects.Container;
  selectionLayer: Phaser.GameObjects.Container;
}

export class GalaxyMapOverlayRenderer {
  private readonly laneRenderer: StarlaneObject;
  private readonly routeRenderer: Phaser.GameObjects.Graphics;
  private readonly shipRenderer: Phaser.GameObjects.Graphics;
  private readonly focusLabel: Phaser.GameObjects.Text;
  private readonly selectionGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, layers: OverlayLayers) {
    this.laneRenderer = new StarlaneObject(scene, undefined, layers.hyperlaneLayer);

    this.routeRenderer = scene.add.graphics();
    layers.routeLayer.add(this.routeRenderer);

    this.shipRenderer = scene.add.graphics();
    layers.shipLayer.add(this.shipRenderer);

    this.focusLabel = scene.add.text(0, 0, "", {
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
    layers.labelLayer.add(this.focusLabel);

    this.selectionGraphics = scene.add.graphics();
    layers.selectionLayer.add(this.selectionGraphics);
  }

  renderHyperlanes(
    lanes: Lane[],
    projectedStars: Map<number, ProjectedStar>,
    lookup: GameWorldLookup,
    laneAlpha: number,
    laneWidth: number,
    zoomRatio: number
  ) {
    this.laneRenderer.beginFrame();
    lanes.forEach((lane) => {
      const from = projectedStars.get(lane.from);
      const to = projectedStars.get(lane.to);
      if (!from || !to) {
        return;
      }

      const alpha = Math.min(from.alpha, to.alpha) * (laneAlpha + Math.min(zoomRatio * 0.08, 0.14));
      const laneColor = from.regionId && from.regionId === to.regionId
        ? lookup.getRegionColorByRegionId(from.regionId) ?? UIStyle.PALETTE.CONNECTION_LINE
        : UIStyle.PALETTE.CONNECTION_LINE;

      this.laneRenderer.renderBetween(
        { x: from.screenX, y: from.screenY },
        { x: to.screenX, y: to.screenY },
        alpha,
        laneWidth + Math.min(zoomRatio * 0.12, 0.6),
        laneColor
      );
    });
  }

  renderShipRoutes(companyState: CompanyState, projectedStars: Map<number, ProjectedStar>) {
    this.routeRenderer.clear();
    this.routeRenderer.lineStyle(2, 0x5ed4c6, 0.75);
    companyState.fleet.forEach((ship) => {
      if (!ship.task) {
        return;
      }

      const points = ship.task.path
        .map((starId) => projectedStars.get(starId))
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

  renderShips(companyState: CompanyState, projectedStars: Map<number, ProjectedStar>) {
    this.shipRenderer.clear();
    companyState.fleet.forEach((ship) => {
      const anchorStarId = ship.task ? ship.task.destinationStarId : ship.currentStarId;
      const projected = projectedStars.get(anchorStarId);
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

  renderFocusLabel(activeId: number | null, projectedStars: Map<number, ProjectedStar>, isCameraMoving: boolean, show: boolean, width: number, height: number) {
    if (!show || isCameraMoving || activeId === null) {
      this.focusLabel.setVisible(false);
      return;
    }

    const projected = projectedStars.get(activeId);
    if (!projected || !isProjectedStarVisible(projected, width, height)) {
      this.focusLabel.setVisible(false);
      return;
    }

    this.focusLabel.setVisible(true);
    this.focusLabel.setText(projected.name);
    this.focusLabel.setPosition(projected.screenX, projected.screenY - (projected.radius * 3.4));
  }

  renderSelection(activeId: number | null, projectedStars: Map<number, ProjectedStar>) {
    this.selectionGraphics.clear();
    if (activeId === null) {
      return;
    }

    const projected = projectedStars.get(activeId);
    if (!projected) {
      return;
    }

    this.selectionGraphics.lineStyle(1.5, UIStyle.PALETTE.STELLAR_GLOW, 0.75);
    this.selectionGraphics.strokeCircle(projected.screenX, projected.screenY, projected.radius * 3.1);
    this.selectionGraphics.lineStyle(1, UIStyle.PALETTE.STELLAR_GLOW, 0.24);
    this.selectionGraphics.strokeCircle(projected.screenX, projected.screenY, projected.radius * 4.6);
  }
}

function isProjectedStarVisible(projected: ProjectedStar, width: number, height: number, padding = 32) {
  return projected.screenX >= -padding
    && projected.screenX <= width + padding
    && projected.screenY >= -padding
    && projected.screenY <= height + padding;
}
