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
    region?: 'CORE' | 'MID_RIM' | 'OUTER_RIM';
    fuelPrice?: number;
    piracyRisk?: number;
    connections?: number[];
}

export interface CompetitorCompany {
    name: string;
    reputation: number;
}

export class Universe {
    public stars: Star[] = [];
    public competitors: CompetitorCompany[] = [
        { name: 'Void Express Corp', reputation: 45 },
        { name: 'Stellar Freight Inc', reputation: 38 },
        { name: 'Galaxy Logistics', reputation: 52 }
    ];

    public loadSstarData(starData: Star[]) {
        this.stars = starData;
        
        // HOTFIX: Previne colisões de 64-bit no JS reescrevendo o ID para o índice real
        this.stars.forEach((star, index) => {
            star.source_id = index;
        });

        console.log(`Universo carregado: ${this.stars.length} estrelas mapeadas.`);
        
        // Classifica as regiões
        this.classifyRegions();
        
        // Gera a malha estelar
        this.generateStarlanes(5);
    }

    private classifyRegions(): void {
        this.stars.forEach(star => {
            const distanceFromCenter = Math.sqrt(star.x * star.x + star.y * star.y + star.z * star.z);
            
            // CORREÇÃO: Ajuste da escala galáctica para o JSON real
            if (distanceFromCenter <= 300) { // Era 30
                star.region = 'CORE';
                star.fuelPrice = 1;
                star.piracyRisk = 0.05;
            } else if (distanceFromCenter <= 700) { // Era 80
                star.region = 'MID_RIM';
                star.fuelPrice = 3;
                star.piracyRisk = 0.20;
            } else {
                star.region = 'OUTER_RIM';
                star.fuelPrice = 5;
                star.piracyRisk = 0.45;
            }
            
            // Initialize connections array
            star.connections = [];
        });
    }

    public generateStarlanes(maxConnections: number): void {
        this.stars.forEach(starA => {
            if (!starA.connections) starA.connections = [];
            
            // Encontra as estrelas mais próximas (ignorando a distância máxima)
            const nearbyStars = this.stars
                .filter(starB => starB.source_id !== starA.source_id)
                .map(starB => ({
                    star: starB,
                    distance: this.calculateDistance(starA, starB)
                }))
                // Removemos o filtro problemático de distância máxima aqui!
                .sort((a, b) => a.distance - b.distance)
                .slice(0, maxConnections); // Pega sempre os N vizinhos mais próximos
            
            // Cria as conexões bidirecionais
            nearbyStars.forEach(entry => {
                const starB = entry.star;
                
                if (!starA.connections!.includes(starB.source_id)) {
                    starA.connections!.push(starB.source_id);
                }
                
                if (!starB.connections) starB.connections = [];
                if (!starB.connections.includes(starA.source_id)) {
                    starB.connections.push(starA.source_id);
                }
            });
        });
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

    public getStarById(sourceId: number): Star | undefined {
        return this.stars[sourceId];
    }
}
