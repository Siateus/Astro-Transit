import { Lane } from "../types/MapData";
import { buildStarGraph, computePathDistance, findShortestPath, StarGraph } from "./routing";
import { StarLookup } from "./starLookup";

export interface NavigationLookup {
  findShortestPath(originStarId: number, destinationStarId: number): number[];
  computePathDistance(path: number[]): number;
}

export class GraphNavigationLookup implements NavigationLookup {
  private readonly graph: StarGraph;

  constructor(lanes: Lane[], private readonly starLookup: StarLookup) {
    this.graph = buildStarGraph(lanes);
  }

  findShortestPath(originStarId: number, destinationStarId: number) {
    return findShortestPath(this.graph, originStarId, destinationStarId);
  }

  computePathDistance(path: number[]) {
    return computePathDistance(path, this.starLookup);
  }
}
