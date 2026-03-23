import { Star, Universe } from './Universe.ts'
import { GameConfig } from '../utils/GameConfig.ts'

export class Contract {
    public id: string;
    public origin: Star;
    public destination: Star;
    public distance: number;
    public reward: number;
    public riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';

    constructor(universe: Universe) {
        this.id = 'CTR-' + Math.floor(Math.random() * 99999);

        this.origin = universe.getRandomStar();
        let dest = universe.getRandomStar();

        while (dest.source_id === this.origin.source_id) {
            dest = universe.getRandomStar();
        }
        this.distance = universe.calculateDistance(this.origin, this.destination);

        this.reward = Math.floor((this.distance * 10) + GameConfig.STARTING_CREDITS * 0.1);

        if (this.distance > 50) {
            this.riskLevel = 'ALTO';
        } else if (this.distance > 20) {
            this.riskLevel = 'MÉDIO';
        } else {
            this.riskLevel = 'BAIXO';
        }
    }
}
