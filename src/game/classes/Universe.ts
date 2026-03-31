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
    hasStation?: boolean;
    isExplored?: boolean;
    influence?: number;
    owner?: string | null;
    visitCount?: number;
}

export interface CompetitorCompany {
    name: string;
    reputation: number;
    credits: number;
}

export class Universe {
    public stars: Star[] = [];
    public competitors: CompetitorCompany[] = [
        { name: 'Void Express Corp', reputation: 45, credits: 15000 },
        { name: 'Stellar Freight Inc', reputation: 38, credits: 20000 },
        { name: 'Galaxy Logistics', reputation: 52, credits: 18000 }
    ];

    public loadSstarData(starData: Star[]) {
        this.stars = starData;
        
        // HOTFIX: Previne colisões de 64-bit no JS reescrevendo o ID para o índice real
        this.stars.forEach((star, index) => {
            star.source_id = index;
            // Inicializa influência e ownership
            star.influence = 0;
            star.owner = null;
        });

        console.log(`Universo carregado: ${this.stars.length} estrelas mapeadas.`);
        
        // Classifica as regiões
        this.classifyRegions();
        
        // Gera a malha estelar (4 conexões para melhor conectividade da galáxia)
        this.generateStarlanes(4);
        
        // Inicializa o mapa: explora o sistema capital
        this.exploreNode(0);
        
        // O Sistema Capital já começa dominado pelo jogador
        this.stars[0].influence = 100;
        this.stars[0].owner = 'PLAYER';
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
            
            // Gera postos de combustível (20% de chance, garantido no ID 0)
            star.hasStation = (star.source_id === 0) || (Math.random() < 0.20);
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

    public exploreNode(starId: number): void {
        const star = this.getStarById(starId);
        if (!star) return;

        // Marca a estrela como explorada
        star.isExplored = true;
        star.visitCount = (star.visitCount || 0) + 1;

        // Marca todos os vizinhos diretos como explorados
        if (star.connections && star.connections.length > 0) {
            star.connections.forEach(neighborId => {
                const neighbor = this.getStarById(neighborId);
                if (neighbor) {
                    neighbor.isExplored = true;
                }
            });
        }
    }

    /**
     * Calcula risco de pirataria dinâmico baseado em exploração
     * - Não explorado: 80% (muito perigoso, desconhecido)
     * - Explorado: Risco reduzido por região (5-35%)
     * - Visitado múltiplas vezes: Risco reduz 50% ao atingir 3+ visitas
     */
    public recalculatePiracyRisk(star: Star): number {
        // Se não foi explorado, risco máximo (desconhecido)
        if (!star.isExplored) {
            return 0.8;
        }

        // Base de risco por região
        let baseRisk = 0.1;
        if (star.region === 'CORE') {
            baseRisk = 0.05;
        } else if (star.region === 'MID_RIM') {
            baseRisk = 0.15; // Reduzido de 0.20
        } else if (star.region === 'OUTER_RIM') {
            baseRisk = 0.35; // Reduzido de 0.45
        }

        // Reduz risco 50% se visitado 3+ vezes (familiaridade)
        if ((star.visitCount || 0) >= 3) {
            baseRisk *= 0.5;
        }

        return baseRisk;
    }
}

export function projectStar(star: Star, scaleFactor: number): { x: number, y: number } {
    // Aspecto 2.5D pseudo-isométrico (Disco Inclinado a 60 graus)
    const TILT_ANGLE = Math.PI / 3; 
    
    const x = star.x * scaleFactor;
    // Comprime o Y e levanta fisicamente o Z da estrela caso exista
    const y = (star.y * Math.cos(TILT_ANGLE) - (star.z || 0) * Math.sin(TILT_ANGLE)) * scaleFactor;
    
    return { x, y };
}
