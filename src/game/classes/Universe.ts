export interface Star {
    source_id: number;
    ra: number;
    dec: number;
    parallax: number;
    phot_g_mean_mag: number;
    distance_pc: number;
    x: number;
    y: number;
    z: number;

}

export class Universe {
    public stars: Star[] = [];

    public loadSstarData(starData: Star[]) {
        this.stars = starData;
        console.log(`Universo carregado: ${this.stars.length} estrelas mapeadas.`);

    }

    public getRandomStar(): Star {
        const randomindex = Math.floor(Math.random() * this.stars.length);
        return this.stars[randomindex];
    }

    public calculateDistance(starA: Star, starB: Star): number {
        const dx = starB.x - starA.x;
        const dy = starB.y - starA.y;
        const dz = starB.z - starA.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}
