import Phaser from "phaser";
import StarObject3D from "../objects/Star";
import { GalaxyBackgroundRenderer } from "../renderers/GalaxyBackgroundRenderer";
import { GalaxyMapOverlayRenderer } from "../renderers/GalaxyMapOverlayRenderer";
import { GalaxyStarfieldRenderer } from "../renderers/GalaxyStarfieldRenderer";
import { OperationsHudRenderer } from "../renderers/OperationsHudRenderer";
import { GalaxyVisualConfig } from "../types/GalaxyVisual";

export interface GameSceneVisualSetup {
  backgroundRenderer: GalaxyBackgroundRenderer;
  starRenderer: StarObject3D;
  starfieldRenderer: GalaxyStarfieldRenderer;
  overlayRenderer: GalaxyMapOverlayRenderer;
  hudRenderer: OperationsHudRenderer;
}

export function setupGameSceneVisuals(
  scene: Phaser.Scene,
  visualConfig: GalaxyVisualConfig
): GameSceneVisualSetup {
  const layers = createLayers(scene);

  const backgroundRenderer = new GalaxyBackgroundRenderer(scene, layers.backgroundLayer);
  backgroundRenderer.render(scene.scale.width, scene.scale.height, visualConfig);

  const starRenderer = new StarObject3D(scene, layers.starLayer);
  const starfieldRenderer = new GalaxyStarfieldRenderer(starRenderer);
  const overlayRenderer = new GalaxyMapOverlayRenderer(scene, {
    hyperlaneLayer: layers.hyperlaneLayer,
    routeLayer: layers.routeLayer,
    shipLayer: layers.shipLayer,
    labelLayer: layers.labelLayer,
    selectionLayer: layers.selectionLayer
  });
  const hudRenderer = new OperationsHudRenderer(scene, layers.hudLayer);

  return {
    backgroundRenderer,
    starRenderer,
    starfieldRenderer,
    overlayRenderer,
    hudRenderer
  };
}

function createLayers(scene: Phaser.Scene) {
  return {
    backgroundLayer: scene.add.container(0, 0).setDepth(0),
    hyperlaneLayer: scene.add.container(0, 0).setDepth(20),
    routeLayer: scene.add.container(0, 0).setDepth(24),
    starLayer: scene.add.container(0, 0).setDepth(30),
    shipLayer: scene.add.container(0, 0).setDepth(34),
    labelLayer: scene.add.container(0, 0).setDepth(40),
    selectionLayer: scene.add.container(0, 0).setDepth(50),
    hudLayer: scene.add.container(0, 0).setDepth(100)
  };
}
