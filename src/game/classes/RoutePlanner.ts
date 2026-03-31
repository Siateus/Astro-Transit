import { Star, Universe } from './Universe';



export class RoutePlanner {
    /**
     * Calculates the shortest path between two stars using Dijkstra's algorithm.
     * Navigates exclusively through starlane connections.
     * 
     * @param universe Universe instance with starlane graph
     * @param startStar Starting star
     * @param targetStar Target star
     * @returns Array of Stars representing the path (including start and target), or null if no path exists
     */
    public static calculatePath(
        universe: Universe,
        startStar: Star,
        targetStar: Star
    ): Star[] | null {
        if (!startStar.connections || startStar.connections.length === 0) {
            return null;
        }

        const distances = new Map<number, number>();
        const previous = new Map<number, Star | null>();
        const unvisited = new Set<number>();

        universe.stars.forEach(star => {
            distances.set(star.source_id, Infinity);
            previous.set(star.source_id, null);
            unvisited.add(star.source_id);
        });
        distances.set(startStar.source_id, 0);

        while (unvisited.size > 0) {
            let current_id: number | null = null;
            let min_distance = Infinity;

            for (const id of unvisited) {
                const dist = distances.get(id) ?? Infinity; 
                if (dist < min_distance) {
                    min_distance = dist;
                    current_id = id;
                }
            }

            if (current_id === null || min_distance === Infinity) {
                break; // Unreachable nodes remain
            }

            if (current_id === targetStar.source_id) {
                return this.reconstructPath(universe, startStar, targetStar, previous);
            }

            unvisited.delete(current_id);

            const currentStar = universe.getStarById(current_id);
            if (!currentStar || !currentStar.connections) continue;

            for (const neighborId of currentStar.connections) {
                if (!unvisited.has(neighborId)) continue;

                const neighborStar = universe.getStarById(neighborId);
                if (!neighborStar) continue;

                const edgeDistance = universe.calculateDistance(currentStar, neighborStar);
                const totalDistance = (distances.get(current_id) ?? 0) + edgeDistance;
                const currentNeighborDist = distances.get(neighborId) ?? Infinity;

                if (totalDistance < currentNeighborDist) {
                    distances.set(neighborId, totalDistance);
                    previous.set(neighborId, currentStar);
                }
            }
        }

        // Se sair do loop porque não havia caminho possível, retorna null.
        return null;
    }

    /**
     * Reconstruct the path from target back to start using the previous map
     */
    private static reconstructPath(
        _universe: Universe,
        startStar: Star,
        targetStar: Star,
        previous: Map<number, Star | null>
    ): Star[] {
        const path: Star[] = [];
        let current: Star | null = targetStar;

        while (current !== null) {
            path.unshift(current);
            if (current.source_id === startStar.source_id) {
                break;
            }
            current = previous.get(current.source_id) || null;
        }

        // Verify path starts with startStar
        if (path.length === 0 || path[0].source_id !== startStar.source_id) {
            return null as any;
        }

        return path;
    }
}
