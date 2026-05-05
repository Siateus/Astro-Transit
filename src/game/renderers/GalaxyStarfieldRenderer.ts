import StarObject3D from "../objects/Star";
import { CameraViewState, projectStar } from "../spatial/GalaxyProjection";
import { ProjectedStar } from "../types/GalaxyVisual";
import { Star } from "../types/MapData";
import { GameWorldLookup } from "../world/GameWorldLookup";

interface RenderOptions {
  stars: Star[];
  viewState: CameraViewState;
  glowStrength: number;
  isHighlighted: (starId: number) => boolean;
  lookup: GameWorldLookup;
  mapMode: "political" | "risk";
}

export class GalaxyStarfieldRenderer {
  private readonly starRenderer: StarObject3D;

  constructor(starRenderer: StarObject3D) {
    this.starRenderer = starRenderer;
  }

  render(options: RenderOptions) {
    const projectedStars = new Map<number, ProjectedStar>();
    this.starRenderer.beginFrame();

    options.stars.forEach((star) => {
      const projection = projectStar(star, options.viewState, options.lookup.getRegionByStarId(star.id));
      projectedStars.set(star.id, projection);

      this.starRenderer.renderAt(
        star,
        projection.screenX,
        projection.screenY,
        projection.radius,
        projection.alpha,
        options.glowStrength,
        options.isHighlighted(projection.id),
        projection.regionId ? getRegionOverlayColor(options.lookup, projection.regionId, options.mapMode) : undefined,
        projection.isCapital
      );
    });

    return projectedStars;
  }
}

function getRegionOverlayColor(
  lookup: GameWorldLookup,
  regionId: string,
  mapMode: RenderOptions["mapMode"]
) {
  return mapMode === "risk"
    ? lookup.getRegionRiskColorByRegionId(regionId)
    : lookup.getRegionColorByRegionId(regionId);
}
