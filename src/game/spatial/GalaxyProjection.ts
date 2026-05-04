import Phaser from "phaser";
import { Region } from "../models/Region";
import { ProjectedStar } from "../types/GalaxyVisual";
import { Star } from "../types/MapData";

export interface CameraViewState {
  width: number;
  height: number;
  viewScale: number;
  baseScale: number;
  maxDepth: number;
  cameraOffsetX: number;
  cameraOffsetY: number;
  pitch: number;
}

export function calculateInitialScale(stars: Star[], width: number, height: number) {
  const maxX = Math.max(...stars.map((star) => Math.abs(star.x)), 1);
  const maxY = Math.max(...stars.map((star) => Math.abs(star.y)), 1);
  return Math.min((width * 0.42) / maxX, (height * 0.4) / maxY);
}

export function calculateMaxDepth(stars: Star[]) {
  return Math.max(
    ...stars.map((star) => Math.max(Math.abs(star.x), Math.abs(star.y), Math.abs(star.z ?? 0))),
    1
  );
}

export function projectStar(star: Star, viewState: CameraViewState, region?: Region): ProjectedStar {
  const rotatedStar = rotateStar(star, viewState.pitch);
  const depth = rotatedStar.z ?? 0;
  const normalizedDepth = Phaser.Math.Clamp((depth + viewState.maxDepth) / (2 * viewState.maxDepth), 0.25, 1);
  const importance = Phaser.Math.Clamp((Math.abs(star.x) + Math.abs(star.y)) / viewState.maxDepth, 0.2, 1);
  const radius = Phaser.Math.Linear(1.8, 3.8, importance) * Phaser.Math.Linear(0.86, 1.4, normalizedDepth);

  return {
    id: star.id,
    star,
    name: star.name ?? `Sistema ${star.id}`,
    screenX: getViewCenterX(viewState) + rotatedStar.x * viewState.viewScale,
    screenY: getViewCenterY(viewState) - rotatedStar.y * viewState.viewScale,
    alpha: normalizedDepth,
    radius,
    importance,
    isCapital: region?.capitalSystemId === star.id,
    regionId: region?.id
  };
}

export function rotateStar(star: Star, pitch: number): Star {
  const pitchSin = Math.sin(pitch);
  const pitchCos = Math.cos(pitch);
  const pitchY = star.y * pitchCos + (star.z ?? 0) * pitchSin;
  const pitchZ = (star.z ?? 0) * pitchCos - star.y * pitchSin;

  return {
    ...star,
    x: star.x,
    y: pitchY,
    z: pitchZ
  };
}

export function clampCameraOffset(
  stars: Star[],
  viewState: CameraViewState,
  minOffsetScreenFraction: number
) {
  const horizontalReach = getProjectedHalfSpan(stars, "x", viewState);
  const verticalReach = getProjectedHalfSpan(stars, "y", viewState);
  const minOffsetX = viewState.width * minOffsetScreenFraction;
  const minOffsetY = viewState.height * minOffsetScreenFraction;
  const maxOffsetX = Math.max(horizontalReach - (viewState.width / 2), minOffsetX);
  const maxOffsetY = Math.max(verticalReach - (viewState.height / 2), minOffsetY);

  return {
    x: Phaser.Math.Clamp(viewState.cameraOffsetX, -maxOffsetX, maxOffsetX),
    y: Phaser.Math.Clamp(viewState.cameraOffsetY, -maxOffsetY, maxOffsetY)
  };
}

export function findHoveredStar(projectedStars: Iterable<ProjectedStar>, pointerX: number, pointerY: number, pickRadius: number) {
  let closestId: number | null = null;
  let smallestDistance = pickRadius;

  for (const projected of projectedStars) {
    const distance = Phaser.Math.Distance.Between(pointerX, pointerY, projected.screenX, projected.screenY);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestId = projected.id;
    }
  }

  return closestId;
}

export function isProjectedStarVisible(projected: ProjectedStar, width: number, height: number, padding = 32) {
  return projected.screenX >= -padding
    && projected.screenX <= width + padding
    && projected.screenY >= -padding
    && projected.screenY <= height + padding;
}

function getProjectedHalfSpan(stars: Star[], axis: "x" | "y", viewState: CameraViewState) {
  return Math.max(
    ...stars.map((star) => {
      const rotatedStar = rotateStar(star, viewState.pitch);
      return Math.abs(axis === "x" ? rotatedStar.x : rotatedStar.y) * viewState.viewScale;
    }),
    1
  );
}

function getViewCenterX(viewState: CameraViewState) {
  return (viewState.width / 2) + viewState.cameraOffsetX;
}

function getViewCenterY(viewState: CameraViewState) {
  return (viewState.height / 2) + viewState.cameraOffsetY;
}
