import Phaser from "phaser";
import { Lane } from "../types/MapData";
import { RegionLookup } from "./regionLookup";
import { StarLookup } from "./starLookup";

export type StarGraph = Map<number, number[]>;

export interface RouteProfile {
  originRegionId?: string;
  destinationRegionId?: string;
  riskModifier: number;
  taxMultiplier: number;
  logisticsMultiplier: number;
  piracyMultiplier: number;
  eventMultiplier: number;
}

export function buildStarGraph(lanes: Lane[]) {
  const graph: StarGraph = new Map();

  lanes.forEach((lane) => {
    if (!graph.has(lane.from)) {
      graph.set(lane.from, []);
    }
    if (!graph.has(lane.to)) {
      graph.set(lane.to, []);
    }
    graph.get(lane.from)!.push(lane.to);
    graph.get(lane.to)!.push(lane.from);
  });

  return graph;
}

export function findShortestPath(graph: StarGraph, originStarId: number, destinationStarId: number) {
  if (originStarId === destinationStarId) {
    return [originStarId];
  }

  const queue: number[][] = [[originStarId]];
  const visited = new Set<number>([originStarId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    const neighbors = graph.get(node) ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      const nextPath = [...path, neighbor];
      if (neighbor === destinationStarId) {
        return nextPath;
      }

      visited.add(neighbor);
      queue.push(nextPath);
    }
  }

  return [];
}

export function computePathDistance(path: number[], starLookup: StarLookup) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const from = starLookup.getStar(path[index - 1]);
    const to = starLookup.getStar(path[index]);
    if (!from || !to) {
      continue;
    }
    total += Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
  }
  return total;
}

export function computeRouteProfile(path: number[], regionLookup?: RegionLookup): RouteProfile {
  const regions = path
    .map((systemId) => regionLookup?.getRegionByStarId(systemId))
    .filter((region): region is NonNullable<typeof region> => Boolean(region));

  if (regions.length === 0) {
    return {
      riskModifier: 0,
      taxMultiplier: 1,
      logisticsMultiplier: 1,
      piracyMultiplier: 1,
      eventMultiplier: 1
    };
  }

  const averageDanger = average(regions.map((region) => region.stats.danger));
  const averagePiracy = average(regions.map((region) => region.stats.piracy));
  const averageSecurity = average(regions.map((region) => region.stats.security));
  const averageTax = average(regions.map((region) => region.stats.tax));
  const averageLogistics = average(regions.map((region) => region.stats.logistics));

  return {
    originRegionId: regions[0]?.id,
    destinationRegionId: regions[regions.length - 1]?.id,
    riskModifier: Phaser.Math.Clamp((averageDanger * 0.32) + (averagePiracy * 0.28) - (averageSecurity * 0.18), -0.12, 0.36),
    taxMultiplier: 1 + averageTax,
    logisticsMultiplier: 1 + ((1 - averageLogistics) * 0.35),
    piracyMultiplier: 1 + averagePiracy,
    eventMultiplier: Phaser.Math.Clamp(1 + averageDanger + (averagePiracy * 0.5) - averageSecurity, 0.55, 1.85)
  };
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
