import { Star, Universe } from './Universe'
import { GameConfig } from '../utils/GameConfig'
import { RoutePlanner } from './RoutePlanner'

export class Contract {
    public id: string;
    public origin: Star;
    public destination: Star;
    public path: Star[] = [];
    public distance: number;
    public estimatedFuelCost: number;
    public averagePiracyRisk: number;
    public reward: number;
    public riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';
    public status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'FAILED';
    public deadlineDays: number;

    constructor(universe: Universe, origin: Star, destination: Star) {
        this.id = 'CTR-' + Math.floor(Math.random() * 99999);
        this.origin = origin;
        this.destination = destination;
        this.status = 'PENDING';
        this.distance = 0;
        this.estimatedFuelCost = 0;
        this.averagePiracyRisk = 0;
        this.reward = 0;
        this.riskLevel = 'BAIXO';
        this.deadlineDays = (this.path.length * 2) + 3;

        // Calculate path using Dijkstra's algorithm
        const calculatedPath = RoutePlanner.calculatePath(universe, origin, destination);

        if (calculatedPath === null) {
            // No route available
            this.status = 'FAILED';
            this.path = [];
            this.distance = 0;
            this.estimatedFuelCost = 0;
            this.averagePiracyRisk = 0;
            this.reward = 0;
            return;
        }

        this.path = calculatedPath;

        // Calculate distance as sum of jumps in the path
        this.calculateDistanceFromPath();

        // Calculate average piracy risk from stars in path
        this.calculateAveragePiracyRisk();

        // Calculate estimated fuel cost
        this.calculateEstimatedFuelCost();

        // Determine risk level based on average piracy risk
        this.determineRiskLevel();

        // Calculate reward
        this.calculateReward();
    }

    private calculateDistanceFromPath(): void {
        this.distance = 0;
        for (let i = 0; i < this.path.length - 1; i++) {
            const starA = this.path[i];
            const starB = this.path[i + 1];
            const dx = starB.x - starA.x;
            const dy = starB.y - starA.y;
            const dz = starB.z - starA.z;
            const jumpDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            this.distance += jumpDistance;
        }
    }

    private calculateAveragePiracyRisk(): void {
        if (this.path.length === 0) {
            this.averagePiracyRisk = 0;
            return;
        }

        let totalRisk = 0;
        let riskCount = 0;

        for (const star of this.path) {
            if (star.piracyRisk !== undefined) {
                totalRisk += star.piracyRisk;
                riskCount++;
            }
        }

        this.averagePiracyRisk = riskCount > 0 ? totalRisk / riskCount : 0;
    }

    private calculateEstimatedFuelCost(): void {
        this.estimatedFuelCost = 0;
        for (const star of this.path) {
            // Usa o fuelPrice da estrela ou o preço padrão do Config
            const price = star.fuelPrice ?? GameConfig.FUEL_COST_PER_UNIT;
            this.estimatedFuelCost += price;
        }
    }

    private determineRiskLevel(): void {
        if (this.averagePiracyRisk <= 0.15) {
            this.riskLevel = 'BAIXO';
        } else if (this.averagePiracyRisk <= 0.30) {
            this.riskLevel = 'MÉDIO';
        } else {
            this.riskLevel = 'ALTO';
        }
    }

    private calculateReward(): void {
        let baseReward = Math.floor(this.distance * 100) + (this.estimatedFuelCost * 2);

        if (this.riskLevel === 'ALTO') {
            this.reward = Math.floor(baseReward * 1.5);
        } else if (this.riskLevel === 'MÉDIO') {
            this.reward = Math.floor(baseReward * 1.2);
        } else {
            this.reward = baseReward;
        }
    }
}
