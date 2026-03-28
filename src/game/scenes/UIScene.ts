// src/game/scenes/UIScene.ts
import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { GameConfig } from '../utils/GameConfig';
import { Company } from '../classes/Company';
import { Star } from '../classes/Universe';
import { Contract } from '../classes/Contract';

export class UIScene extends Scene {
    private creditsText!: GameObjects.Text;
    private repText!: GameObjects.Text;
    private dateText!: GameObjects.Text;
    private targetPanel!: GameObjects.Container;
    private targetText!: GameObjects.Text;
    private selectedStar: Star | null = null;
    private contractPanel!: GameObjects.Container;
    private contractDetailsText!: GameObjects.Text;
    private currentContract: Contract | null = null;
    private currentContractShipId: string | null = null;
    private eventAlerts: GameObjects.Container[] = [];
    private company: Company | null = null;
    private fleetPanel!: GameObjects.Container;
    private activeShipId: string | null = null;
    private marketPanel!: GameObjects.Container;
    private marketContracts: Contract[] = [];
    private marketShipId: string | null = null;
    private shipyardPanel!: GameObjects.Container;

    constructor() {
        super('UIScene');
    }
    init(data: { company: Company }) {
        if (data.company) {
            this.company = data.company;
        }
    }

    create() {

        const barHeight = 50;
        this.add.image(0, 0, 'topbar')
            .setOrigin(0, 0)
            .setDisplaySize(GameConfig.WIDTH, barHeight);

        const textStyle = { fontFamily: 'Courier New, monospace', fontSize: 18, color: '#f2f2f2' };
        const highlightStyle = { fontFamily: 'Courier New, monospace', fontSize: 20, color: '#00ff00', fontStyle: 'bold' };

        // Agora usa os dados reais da empresa que chegaram no init()
        const companyName = this.company ? this.company.name : 'Empresa Desconhecida';
        const companyRep = this.company ? this.company.reputation : 0;
        const companyCred = this.company ? this.company.credits.toLocaleString() : 0;

        this.repText = this.add.text(20, barHeight / 2, `🏢 ${companyName}  |    Rep: ${companyRep}`, textStyle)
            .setOrigin(0, 0.5);

        this.creditsText = this.add.text(GameConfig.WIDTH / 2, barHeight / 2, ` ¢ ${companyCred}`, highlightStyle)
            .setOrigin(0.5, 0.5);

        this.createRightModule(barHeight);


        this.createFloatingTargetPanel();

        this.createContractModal();

        this.createFleetModal();

        this.createMarketPanel();

        this.createShipyardPanel();

    

        EventBus.on('update-credits', (newCredits: number) => {
            this.creditsText.setText(` ¢ ${newCredits.toLocaleString()}`);
        });

        EventBus.on('update-day', (day: number) => {
            this.dateText.setText(`DIA ${day}`);
        });

        EventBus.on('star-selected', (star: Star | null) => {
            this.selectedStar = star;
            if (star) {
                this.targetPanel.setVisible(true);
                const dist = Math.sqrt((star.x) ** 2 + (star.y) ** 2).toFixed(2);
                this.targetText.setText(`SISTEMA: ${star.source_id}\nDISTÂNCIA: ${dist} PC\nMAGNITUDE: ${star.phot_g_mean_mag.toFixed(1)}`);
            } else {
                this.targetPanel.setVisible(false);
            }
        });

        EventBus.on('contract-details', (contract: Contract, shipId: string) => {
            
            if (contract.status === 'FAILED') {
                EventBus.emit('log-event', 'ERRO: Sistema inalcançável! Nenhuma rota estelar conectada.');
                return;
            }
            this.currentContract = contract;
            this.currentContractShipId = shipId;
            this.contractDetailsText.setText(
                `ID: ${contract.id}\n` +
                `ORIGEM: Sistema ${contract.origin.source_id}\n` +
                `DESTINO: Sistema ${contract.destination.source_id}\n` +
                `DISTÂNCIA: ${contract.distance.toFixed(2)} PC\n` +
                `PAGAMENTO: ¢ ${contract.reward.toLocaleString()}\n` +
                `RISCO: ${contract.riskLevel}`
            );
            this.contractPanel.setVisible(true);
            this.contractPanel.setScale(0);
            this.tweens.add({
                targets: this.contractPanel,
                scale: 1,
                duration: 300,
                ease: 'Back.easeOut'
            });
        });

        EventBus.on('log-event', (message: string) => {
            this.showEventAlert(message);
        });

        EventBus.on('market-data-ready', (contracts: Contract[], shipId: string) => {
            this.marketContracts = contracts;
            this.marketShipId = shipId;
            this.displayMarketPanel();
        });

        EventBus.on('fleet-updated', () => {
            this.updateFleetPanel();
        });
    }

    private createRightModule(barHeight: number) {
        const rightEdge = GameConfig.WIDTH - 20;

        this.createIconButton(rightEdge - 20, barHeight / 2, 'icon_ff', () => EventBus.emit('time-fastforward'));

        this.createIconButton(rightEdge - 70, barHeight / 2, 'icon_play', () => EventBus.emit('time-play'));

        this.createIconButton(rightEdge - 120, barHeight / 2, 'icon_pause', () => EventBus.emit('time-pause'));

        // Shipyard button
        const shipyardBtnText = this.add.text(rightEdge - 240, barHeight / 2, 'ESTALEIRO', { fontFamily: 'Courier New, monospace', fontSize: 13, color: '#ffaa00' }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
        shipyardBtnText.on('pointerover', () => shipyardBtnText.setColor('#ffffff'));
        shipyardBtnText.on('pointerout', () => shipyardBtnText.setColor('#ffaa00'));
        shipyardBtnText.on('pointerdown', () => {
            if (this.shipyardPanel.visible) {
                this.shipyardPanel.setVisible(false);
                this.shipyardPanel.setScale(0);
            } else {
                this.shipyardPanel.setVisible(true);
                this.shipyardPanel.setScale(0);
                this.tweens.add({
                    targets: this.shipyardPanel,
                    scale: 1,
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            }
        });

        // Fleet button
        const fleetBtnText = this.add.text(rightEdge - 170, barHeight / 2, 'FROTA', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#39c0f9' }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
        fleetBtnText.on('pointerover', () => fleetBtnText.setColor('#ffffff')); // Mudei de amarelo para branco
        fleetBtnText.on('pointerout', () => fleetBtnText.setColor('#39c0f9'));
        fleetBtnText.on('pointerdown', () => {
            this.fleetPanel.setVisible(!this.fleetPanel.visible);
            if (this.fleetPanel.visible) {
                this.updateFleetPanel();
            }
        });

        this.dateText = this.add.text(rightEdge - 160, barHeight / 2, `DIA 1`, { fontFamily: 'Courier New, monospace', fontSize: 18, color: '#ffffff' })
            .setOrigin(1, 0.5);
    }

    private createIconButton(x: number, y: number, texture: string, onClick: () => void) {
        const btn = this.add.image(x, y, texture)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5, 0.5)
            .setScale(0.7);
        btn.on('pointerover', () => btn.setTint(0x39c0f9));
        btn.on('pointerout', () => btn.clearTint());
        btn.on('pointerdown', () => {
            btn.setTint(0x00ff00);
            onClick();
        });
    }

    private createFloatingTargetPanel() {
        this.targetPanel = this.add.container(GameConfig.WIDTH - 320, GameConfig.HEIGHT - 180);

        const bg = this.add.rectangle(0, 0, 300, 160, 0x0b1d3a, 0.8).setOrigin(0, 0);
        bg.setStrokeStyle(1, 0x39c0f9);

        this.add.rectangle(0, 0, 300, 30, 0x39c0f9, 0.2).setOrigin(0, 0);
        const title = this.add.text(150, 15, 'DADOS DE TELEMETRIA', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#39c0f9' }).setOrigin(0.5, 0.5);

        this.targetText = this.add.text(15, 45, '', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#ffffff', lineSpacing: 8 });

        const contractBtnBg = this.add.rectangle(150, 130, 270, 36, 0xe6a822).setInteractive({ useHandCursor: true });
        const contractBtnText = this.add.text(150, 130, 'ANALISAR ROTAS COMERCIAIS', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#000', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

        contractBtnBg.on('pointerover', () => contractBtnBg.setFillStyle(0xffc13b));
        contractBtnBg.on('pointerout', () => contractBtnBg.setFillStyle(0xe6a822));
        contractBtnBg.on('pointerdown', () => {
            contractBtnBg.setFillStyle(0xaa7700);
            if (this.selectedStar && this.activeShipId) {
                EventBus.emit('analyze-contract', this.activeShipId, this.selectedStar);
            } else {
                console.error("Falha ao gerar contrato. Dados:", { star: this.selectedStar, activeShipId: this.activeShipId });
                EventBus.emit('log-event', 'ERRO: Selecione uma nave antes de analisar rotas comerciais.');
            }
        });

        this.targetPanel.add([bg, title, this.targetText, contractBtnBg, contractBtnText]);
        //this.targetPanel.setVisible(false);
    }

    private createContractModal() {
        this.contractPanel = this.add.container(GameConfig.WIDTH / 2 - 200, GameConfig.HEIGHT / 2 - 150);

        const bg = this.add.rectangle(0, 0, 400, 300, 0x0b1d3a, 0.9).setOrigin(0, 0);
        bg.setStrokeStyle(2, 0x39c0f9);

        const title = this.add.text(200, 20, 'CONTRATO COMERCIAL', { fontFamily: 'Courier New, monospace', fontSize: 18, color: '#39c0f9' }).setOrigin(0.5, 0.5);

        this.contractDetailsText = this.add.text(20, 60, '', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#ffffff', lineSpacing: 10 });

        const acceptBtnBg = this.add.rectangle(100, 250, 120, 40, 0x00ff00).setInteractive({ useHandCursor: true });
        const acceptBtnText = this.add.text(100, 250, 'ACEITAR', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#000' }).setOrigin(0.5, 0.5);

        const declineBtnBg = this.add.rectangle(300, 250, 120, 40, 0xff0000).setInteractive({ useHandCursor: true });
        const declineBtnText = this.add.text(300, 250, 'RECUSAR', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#000' }).setOrigin(0.5, 0.5);

        acceptBtnBg.on('pointerover', () => acceptBtnBg.setFillStyle(0x00aa00));
        acceptBtnBg.on('pointerout', () => acceptBtnBg.setFillStyle(0x00ff00));
        acceptBtnBg.on('pointerdown', () => {
            if (this.currentContract && this.currentContractShipId) {
                EventBus.emit('contract-accepted', this.currentContract, this.currentContractShipId);
                this.contractPanel.setVisible(false);
                this.currentContract = null;
                this.currentContractShipId = null;
            }
        });

        declineBtnBg.on('pointerover', () => declineBtnBg.setFillStyle(0xaa0000));
        declineBtnBg.on('pointerout', () => declineBtnBg.setFillStyle(0xff0000));
        declineBtnBg.on('pointerdown', () => {
            this.contractPanel.setVisible(false);
            this.currentContract = null;
        });

        this.contractPanel.add([bg, title, this.contractDetailsText, acceptBtnBg, acceptBtnText, declineBtnBg, declineBtnText]);
        this.contractPanel.setVisible(false);
        this.contractPanel.setScale(0);
    }

    private showEventAlert(message: string) {
        const alertY = 100 + (this.eventAlerts.length * 60);
        const alertContainer = this.add.container(GameConfig.WIDTH / 2, alertY);

        const alertBg = this.add.rectangle(0, 0, 400, 50, 0xff6600, 0.9).setOrigin(0.5, 0.5);
        alertBg.setStrokeStyle(1, 0xffaa00);
        const alertText = this.add.text(0, 0, message, { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#ffffff', wordWrap: { width: 380 } }).setOrigin(0.5, 0.5);

        alertContainer.add([alertBg, alertText]);
        this.eventAlerts.push(alertContainer);

        this.tweens.add({
            targets: alertContainer,
            alpha: 0,
            delay: 3000,
            duration: 1000,
            onComplete: () => {
                alertContainer.destroy();
                const index = this.eventAlerts.indexOf(alertContainer);
                if (index !== -1) {
                    this.eventAlerts.splice(index, 1);
                }
            }
        });
    }

    private createFleetModal() {
        this.fleetPanel = this.add.container(20, 80);

        const bg = this.add.rectangle(0, 0, 300, 400, 0x0b1d3a, 0.95).setOrigin(0, 0);
        bg.setStrokeStyle(2, 0x39c0f9);

        const title = this.add.text(150, 15, 'FROTA', { fontFamily: 'Courier New, monospace', fontSize: 16, color: '#39c0f9' }).setOrigin(0.5, 0.5);

        this.fleetPanel.add([bg, title]);
        this.fleetPanel.setVisible(false);
    }

    private createMarketPanel() {
        this.marketPanel = this.add.container(GameConfig.WIDTH / 2 - 250, GameConfig.HEIGHT / 2 - 200);

        const bg = this.add.rectangle(0, 0, 500, 400, 0x0b1d3a, 0.95).setOrigin(0, 0);
        bg.setStrokeStyle(2, 0xaa00aa);

        const title = this.add.text(250, 15, 'MERCADO LOCAL', { fontFamily: 'Courier New, monospace', fontSize: 18, color: '#aa00aa' }).setOrigin(0.5, 0.5);

        // Header for contract list
        const headerLine = this.add.line(0, 40, 10, 40, 490, 40, 0xaa00aa, 0.3);

        this.marketPanel.add([bg, title, headerLine]);
        this.marketPanel.setVisible(false);
        this.marketPanel.setScale(0);
    }

    private displayMarketPanel() {
        // Clear previous market items (keep bg, title, and header)
        this.marketPanel.getAll().forEach((child: any, index: number) => {
            if (index > 2) child.destroy(); // Keep bg, title, header
        });

        let yOffset = 60;
        let contractIndex = 0;

        for (const contract of this.marketContracts) {
            if (contractIndex >= 5) break; // Show max 5 contracts

            const destId = contract.destination.source_id ?? 'N/A';
            const distance = contract.distance.toFixed(1);
            const reward = contract.reward;
            const risk = contract.riskLevel;
            const fuelCost = contract.estimatedFuelCost;

            // Contract info text
            const contractText = this.add.text(15, yOffset, 
                `◆ Sistema ${destId} | ¢${reward} | Risco: ${risk}\n  Distância: ${distance}PC | Fuel: ${fuelCost}`,
                { fontFamily: 'Courier New, monospace', fontSize: 11, color: '#ffffff', lineSpacing: 2 }
            );

            // ACEITAR button for this contract
            const acceptBtn = this.add.rectangle(430, yOffset + 8, 60, 30, 0x00cc00).setInteractive({ useHandCursor: true });
            const acceptText = this.add.text(430, yOffset + 8, 'ACEITAR', { fontFamily: 'Courier New, monospace', fontSize: 9, color: '#000' }).setOrigin(0.5, 0.5);

            acceptBtn.on('pointerover', () => acceptBtn.setFillStyle(0x00ff00));
            acceptBtn.on('pointerout', () => acceptBtn.setFillStyle(0x00cc00));
            acceptBtn.on('pointerdown', () => {
                // Accept this contract
                if (this.marketShipId) {
                    EventBus.emit('contract-accepted', contract, this.marketShipId);
                    this.marketPanel.setVisible(false);
                    this.marketContracts = [];
                    this.marketShipId = null;
                }
            });

            this.marketPanel.add([contractText, acceptBtn, acceptText]);
            yOffset += 50;
            contractIndex++;
        }

        // Show the market panel with animation
        this.marketPanel.setVisible(true);
        this.marketPanel.setScale(0);
        this.tweens.add({
            targets: this.marketPanel,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    private createShipyardPanel() {
        this.shipyardPanel = this.add.container(GameConfig.WIDTH / 2 - 200, GameConfig.HEIGHT / 2 - 150);

        const bg = this.add.rectangle(0, 0, 400, 300, 0x0b1d3a, 0.95).setOrigin(0, 0);
        bg.setStrokeStyle(2, 0xffaa00);

        const title = this.add.text(200, 15, 'ESTALEIRO', { fontFamily: 'Courier New, monospace', fontSize: 18, color: '#ffaa00' }).setOrigin(0.5, 0.5);

        const headerLine = this.add.line(0, 40, 10, 40, 390, 40, 0xffaa00, 0.3);

        this.shipyardPanel.add([bg, title, headerLine]);

        // Ship 1: Cargueiro Padrão
        const ship1Text = this.add.text(20, 60, 
            'Cargueiro Padrão\nCapacidade: 2000 u\nVelocidade: 1.0x\nPreço: ¢5000',
            { fontFamily: 'Courier New, monospace', fontSize: 11, color: '#ffffff', lineSpacing: 3 }
        );
        const buyBtn1 = this.add.rectangle(330, 85, 60, 30, 0xffaa00).setInteractive({ useHandCursor: true });
        const buyText1 = this.add.text(330, 85, 'COMPRAR', { fontFamily: 'Courier New, monospace', fontSize: 9, color: '#000' }).setOrigin(0.5, 0.5);

        buyBtn1.on('pointerover', () => buyBtn1.setFillStyle(0xffcc00));
        buyBtn1.on('pointerout', () => buyBtn1.setFillStyle(0xffaa00));
        buyBtn1.on('pointerdown', () => {
            EventBus.emit('log-event', 'Processando compra de Cargueiro...');
            EventBus.emit('request-buy-ship', 'BASIC_CARGO', 5000);
            this.shipyardPanel.setVisible(false);
        });

        // Ship 2: Transporte Rápido
        const ship2Text = this.add.text(20, 140,
            'Transporte Rápido\nCapacidade: 5000 u\nVelocidade: 1.5x\nPreço: ¢8000',
            { fontFamily: 'Courier New, monospace', fontSize: 11, color: '#ffffff', lineSpacing: 3 }
        );
        const buyBtn2 = this.add.rectangle(330, 165, 60, 30, 0xffaa00).setInteractive({ useHandCursor: true });
        const buyText2 = this.add.text(330, 165, 'COMPRAR', { fontFamily: 'Courier New, monospace', fontSize: 9, color: '#000' }).setOrigin(0.5, 0.5);

        buyBtn2.on('pointerover', () => buyBtn2.setFillStyle(0xffcc00));
        buyBtn2.on('pointerout', () => buyBtn2.setFillStyle(0xffaa00));
        buyBtn2.on('pointerdown', () => {
            EventBus.emit('log-event', 'Processando compra de Fragata...');
            EventBus.emit('request-buy-ship', 'ADVANCED_FRIGATE', 8000);
            this.shipyardPanel.setVisible(false);
        });

        // Close button
        const closeBtn = this.add.rectangle(200, 260, 100, 30, 0xff3333).setInteractive({ useHandCursor: true });
        const closeText = this.add.text(200, 260, 'FECHAR', { fontFamily: 'Courier New, monospace', fontSize: 12, color: '#fff' }).setOrigin(0.5, 0.5);

        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xff5555));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0xff3333));
        closeBtn.on('pointerdown', () => {
            this.shipyardPanel.setVisible(false);
        });

        this.shipyardPanel.add([ship1Text, buyBtn1, buyText1, ship2Text, buyBtn2, buyText2, closeBtn, closeText]);
        this.shipyardPanel.setVisible(false);
        this.shipyardPanel.setScale(0);
    }

    private updateFleetPanel() {
        if (!this.company) return;

        // Clear old ship items
        this.fleetPanel.getAll().forEach((child: any, index: number) => {
            if (index > 1) child.destroy(); // Keep bg and title
        });

        let yOffset = 50;
        for (const ship of this.company.fleet) {
            // Status visual indicator: show [ATIVO] if this ship is selected
            const statusIndicator = this.activeShipId === ship.id ? ' [ATIVO]' : '';
            const shipTextColor = this.activeShipId === ship.id ? '#00ff00' : '#ffffff';

            const localId = ship.currentLocation?.source_id ?? 'N/A';
            
            const shipInfoText = this.add.text(15, yOffset, 
                `${ship.name}\nStatus: ${ship.status}\nLocal: ${localId}\nCombustível: ${ship.currentFuel}/${ship.maxFuel}`,
                { fontFamily: 'Courier New, monospace', fontSize: 12, color: '#ffffff', lineSpacing: 4 }
            );

            // SELECT button 
            const selectBtn = this.add.rectangle(155, yOffset + 25, 50, 25, 0x0099ff).setInteractive({ useHandCursor: true });
            const selectText = this.add.text(155, yOffset + 25, 'SEL', { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#000' }).setOrigin(0.5, 0.5);

            selectBtn.on('pointerover', () => selectBtn.setFillStyle(0x00ccff));
            selectBtn.on('pointerout', () => selectBtn.setFillStyle(0x0099ff));
            selectBtn.on('pointerdown', () => {
                this.activeShipId = ship.id;
                this.updateFleetPanel(); // Refresh to show visual indicator
            });

            // MERCADO button 
            const marketBtn = this.add.rectangle(200, yOffset + 25, 50, 25, 0xaa00aa).setInteractive({ useHandCursor: true });
            const marketText = this.add.text(200, yOffset + 25, 'MRC', { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#000' }).setOrigin(0.5, 0.5);

            marketBtn.on('pointerover', () => marketBtn.setFillStyle(0xff00ff));
            marketBtn.on('pointerout', () => marketBtn.setFillStyle(0xaa00aa));
            marketBtn.on('pointerdown', () => {
                if (ship.status !== 'IDLE') {
                    EventBus.emit('log-event', 'ERRO: A nave precisa estar parada para acessar o mercado.');
                    return;
                }
                EventBus.emit('request-market', ship.id, ship.currentLocation!);
            });

            // FUEL button
            const refuelBtn = this.add.rectangle(245, yOffset + 25, 50, 25, 0x00aa00).setInteractive({ useHandCursor: true });
            const refuelText = this.add.text(245, yOffset + 25, 'FUEL', { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#000' }).setOrigin(0.5, 0.5);

            refuelBtn.on('pointerover', () => refuelBtn.setFillStyle(0x00ff00));
            refuelBtn.on('pointerout', () => refuelBtn.setFillStyle(0x00aa00));
            refuelBtn.on('pointerdown', () => {
                EventBus.emit('buy-fuel', { shipId: ship.id, amount: 50 });
            });

            this.fleetPanel.add([shipInfoText, selectBtn, selectText, marketBtn, marketText, refuelBtn, refuelText]);
            yOffset += 80;
        }
    }
}
