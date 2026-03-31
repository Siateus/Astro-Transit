// src/game/scenes/UIScene.ts
import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { GameConfig } from '../utils/GameConfig';
import { Company } from '../classes/Company';
import { Star } from '../classes/Universe';
import { Contract } from '../classes/Contract';
import { UIFactory } from '../ui/UIFactory';
import { UIStyle } from '../ui/UIStyle';
export class UIScene extends Scene {
    private creditsText!: GameObjects.Text;
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
    private rankingPanel!: GameObjects.Container;
    private rankingListText!: GameObjects.Text;
    private eventModal!: GameObjects.Container;
    private eventTitleText!: GameObjects.Text;
    private eventDescText!: GameObjects.Text;
    private eventButtons: GameObjects.Container[] = [];

    constructor() {
        super('UIScene');
    }
    init(data: { company: Company }) {
        if (data.company) {
            this.company = data.company;
        }
    }

    create() {
        const barHeight = 40;
        this.add.image(0, 0, 'panel_title_01')
            .setOrigin(0, 0)
            .setDisplaySize(GameConfig.WIDTH, barHeight)
            .setAlpha(0.95);

        // Use UIStyle presets
        const statusStyle = UIStyle.TYPOGRAPHY.PRESET.STATUS_BAR as any;
        const highlightStyle = UIStyle.TYPOGRAPHY.PRESET.HIGHLIGHT as any;

        // Company info
        const companyName = this.company ? this.company.name : 'Empresa Desconhecida';
        const companyRep = this.company ? this.company.reputation : 0;
        const companyCred = this.company ? this.company.credits.toLocaleString() : 0;

        this.add.text(20, barHeight / 2, `🏢 ${companyName}  |    Rep: ${companyRep}`, statusStyle as any)
            .setOrigin(0, 0.5);

        this.creditsText = this.add.text(GameConfig.WIDTH / 2, barHeight / 2, ` ¢ ${companyCred}`, highlightStyle as any)
            .setOrigin(0.5, 0.5);

        this.createRightModule(barHeight);


        this.createFloatingTargetPanel();

        this.createContractModal();

        this.createFleetModal();

        this.createMarketPanel();

        this.createShipyardPanel();

        this.createRankingPanel();

        this.createEventModal();



    

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
                const ownerText = star.owner === 'PLAYER' ? 'Sua Empresa' : 'Independente';
                const infText = star.owner === 'PLAYER' ? 'MAX' : `${star.influence || 0}%`;
                
                this.targetText.setText(
                    `SISTEMA: ${star.source_id}\nDONO: ${ownerText} (Inf: ${infText})\nPOSTO DE FUEL: ${star.hasStation ? 'SIM' : 'NÃO'}`
                );
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

        // Icon buttons (time controls)
        UIFactory.createIconButton(this, rightEdge - 20, barHeight / 2, 'icon_ff', () => EventBus.emit('time-fastforward'));
        
        let isPaused = false;
        const playPauseBtn = UIFactory.createIconButton(this, rightEdge - 70, barHeight / 2, 'icon_pause', () => {
            isPaused = !isPaused;
            if (isPaused) {
                (playPauseBtn.getAt(1) as Phaser.GameObjects.Image).setTexture('icon_play');
                EventBus.emit('time-pause');
            } else {
                (playPauseBtn.getAt(1) as Phaser.GameObjects.Image).setTexture('icon_pause');
                EventBus.emit('time-play');
            }
        });

        // Shipyard button (Icon placeholder: 🛠)
        UIFactory.createTextButton(this, rightEdge - 120, barHeight / 2, '🛠', UIStyle.PALETTE.PRIMARY_ORANGE, () => {
            if (this.shipyardPanel.visible) {
                this.shipyardPanel.setVisible(false);
                this.shipyardPanel.setScale(0);
            } else {
                this.shipyardPanel.setVisible(true);
                this.shipyardPanel.setScale(0);
                this.tweens.add({
                    targets: this.shipyardPanel,
                    scale: 1,
                    duration: UIStyle.ANIMATION.DURATION_NORMAL,
                    ease: UIStyle.ANIMATION.EASE
                });
            }
        }, 16);

        // Fleet button (Icon placeholder: 🚀)
        UIFactory.createTextButton(this, rightEdge - 170, barHeight / 2, '🚀', UIStyle.PALETTE.PRIMARY_BLUE, () => {
            this.fleetPanel.setVisible(!this.fleetPanel.visible);
            if (this.fleetPanel.visible) {
                this.updateFleetPanel();
            }
        }, 16);

        // Ranking button (Icon placeholder: 🏆)
        UIFactory.createTextButton(this, rightEdge - 220, barHeight / 2, '🏆', UIStyle.PALETTE.PRIMARY_ORANGE, () => {
            EventBus.emit('request-ranking');
        }, 16);

        // Date text
        this.dateText = UIFactory.createText(this, rightEdge - 270, barHeight / 2, 'DIA 1', 'status_bar')
            .setOrigin(1, 0.5);
    }

    private createFloatingTargetPanel() {
        this.targetPanel = this.add.container(GameConfig.WIDTH - 320, GameConfig.HEIGHT - 180);

        // Panel background using asset
        const panelBg = this.add.image(0, 0, 'panel_select_01').setOrigin(0, 0);
        panelBg.setDisplaySize(300, 160);

        // Title
        const title = this.add.text(150, 15, 'DADOS DE TELEMETRIA', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: 14,
            color: '#39c0f9',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // Telemetry text
        this.targetText = this.add.text(15, 45, '', {
            fontFamily: 'Courier New, monospace',
            fontSize: 12,
            color: '#ffffff',
            lineSpacing: 6,
        });

        // Button: Analisar Rotas
        const btnAnalyze = this.add.image(150, 130, 'btn_01').setDisplaySize(200, 30);
        const btnAnalyzeTxt = this.add.text(150, 130, 'ANALISAR ROTAS', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        btnAnalyze.setInteractive({ useHandCursor: true });
        btnAnalyze.on('pointerover', () => btnAnalyze.setTint(0xcccccc));
        btnAnalyze.on('pointerout', () => btnAnalyze.clearTint());
        btnAnalyze.on('pointerdown', () => {
            if (this.selectedStar && this.activeShipId) {
                EventBus.emit('analyze-contract', this.activeShipId, this.selectedStar);
            } else {
                EventBus.emit('log-event', 'ERRO: Selecione uma nave antes de analisar rotas comerciais.');
            }
        });

        this.targetPanel.add([panelBg, title, this.targetText, btnAnalyze, btnAnalyzeTxt]);
    }

    private createContractModal() {
        this.contractPanel = this.add.container(GameConfig.WIDTH / 2 - 200, GameConfig.HEIGHT / 2 - 150);

        // Panel background
        const panelBg = this.add.image(0, 0, 'panel_main_01').setOrigin(0, 0);
        panelBg.setDisplaySize(400, 300);

        // Title
        const title = this.add.text(200, 20, 'CONTRATO COMERCIAL', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: 18,
            color: '#39c0f9',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // Contract details text
        this.contractDetailsText = this.add.text(20, 60, '', {
            fontFamily: 'Courier New, monospace',
            fontSize: 12,
            color: '#ffffff',
            lineSpacing: 8,
        });

        // Accept button
        const btnAccept = this.add.image(100, 250, 'btn_01').setDisplaySize(100, 35);
        const txtAccept = this.add.text(100, 250, 'ACEITAR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        btnAccept.setInteractive({ useHandCursor: true });
        btnAccept.on('pointerover', () => btnAccept.setTint(0xcccccc));
        btnAccept.on('pointerout', () => btnAccept.clearTint());
        btnAccept.on('pointerdown', () => {
            if (this.currentContract && this.currentContractShipId) {
                EventBus.emit('contract-accepted', this.currentContract, this.currentContractShipId);
                this.contractPanel.setVisible(false);
                this.currentContract = null;
                this.currentContractShipId = null;
            }
        });

        // Decline button
        const btnDecline = this.add.image(300, 250, 'btn_01').setDisplaySize(100, 35);
        const txtDecline = this.add.text(300, 250, 'RECUSAR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        btnDecline.setInteractive({ useHandCursor: true });
        btnDecline.on('pointerover', () => btnDecline.setTint(0xcccccc));
        btnDecline.on('pointerout', () => btnDecline.clearTint());
        btnDecline.on('pointerdown', () => {
            this.contractPanel.setVisible(false);
            this.currentContract = null;
        });

        this.contractPanel.add([panelBg, title, this.contractDetailsText, btnAccept, txtAccept, btnDecline, txtDecline]);
        this.contractPanel.setVisible(false);
        this.contractPanel.setScale(0);
    }

    private showEventAlert(message: string) {
        const alertY = 100 + (this.eventAlerts.length * 60);
        const alertContainer = this.add.container(GameConfig.WIDTH / 2, alertY);

        const alertBg = this.add.rectangle(0, 0, 400, 50, UIStyle.PALETTE.EVENT_ALERT_BG, 0.9).setOrigin(0.5, 0.5);
        alertBg.setStrokeStyle(1, UIStyle.PALETTE.WARNING.bg as number);
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

        // Panel background
        const panelBg = this.add.image(0, 0, 'panel_main_01').setOrigin(0, 0);
        panelBg.setDisplaySize(300, 400);

        // Title
        const title = this.add.text(150, 15, 'FROTA', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: 16,
            color: '#39c0f9',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        this.fleetPanel.add([panelBg, title]);
        this.fleetPanel.setVisible(false);
    }

    private createMarketPanel() {
        // Use UIFactory to create market panel (warning type for accent color)
        this.marketPanel = UIFactory.createPanel(
            this,
            GameConfig.WIDTH / 2 - 250,
            GameConfig.HEIGHT / 2 - 200,
            500,
            400,
            'MERCADO LOCAL',
            'warning'
        );

        // Add header divider (local coordinates to panel)
        const headerLine = UIFactory.createDivider(
            this,
            10,
            40,
            490 - 20,
            0xaa00aa  // Purple color for market panel
        );
        this.marketPanel.add(headerLine);

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
            const acceptBtn = this.add.rectangle(430, yOffset + 8, 60, 30, UIStyle.PALETTE.STATUS_OK.bg).setInteractive({ useHandCursor: true });
            const acceptText = this.add.text(430, yOffset + 8, 'ACEITAR', { fontFamily: 'Courier New, monospace', fontSize: 9, color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

            acceptBtn.on('pointerover', () => acceptBtn.setFillStyle(UIStyle.PALETTE.STATUS_OK.hover));
            acceptBtn.on('pointerout', () => acceptBtn.setFillStyle(UIStyle.PALETTE.STATUS_OK.bg));
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
        // Use UIFactory to create shipyard panel
        this.shipyardPanel = UIFactory.createPanel(
            this,
            GameConfig.WIDTH / 2 - 200,
            GameConfig.HEIGHT / 2 - 150,
            400,
            300,
            'ESTALEIRO',
            'warning'
        );

        // Add header divider (local coordinates)
        const headerLine = UIFactory.createDivider(
            this,
            10,
            40,
            390 - 20,
            UIStyle.PALETTE.PRIMARY_ORANGE as any
        );
        this.shipyardPanel.add(headerLine);

        // Ship 1: Cargueiro Padrão
        const ship1Text = UIFactory.createText(
            this,
            20,
            60,
            'Cargueiro Padrão\nCapacidade: 2000 u\nVelocidade: 1.0x\nPreço: ¢5000',
            'body_text'
        );
        ship1Text.setOrigin(0, 0);
        this.shipyardPanel.add(ship1Text);

        const buyBtn1 = UIFactory.createButton(
            this,
            330,
            85,
            'COMPRAR',
            'warning',
            () => {
                EventBus.emit('log-event', 'Processando compra de Cargueiro...');
                EventBus.emit('request-buy-ship', 'BASIC_CARGO', 5000);
                this.shipyardPanel.setVisible(false);
            }
        );
        this.shipyardPanel.add(buyBtn1);

        // Ship 2: Transporte Rápido
        const ship2Text = UIFactory.createText(
            this,
            20,
            140,
            'Transporte Rápido\nCapacidade: 5000 u\nVelocidade: 1.5x\nPreço: ¢8000',
            'body_text'
        );
        ship2Text.setOrigin(0, 0);
        this.shipyardPanel.add(ship2Text);

        const buyBtn2 = UIFactory.createButton(
            this,
            330,
            165,
            'COMPRAR',
            'warning',
            () => {
                EventBus.emit('log-event', 'Processando compra de Fragata...');
                EventBus.emit('request-buy-ship', 'ADVANCED_FRIGATE', 8000);
                this.shipyardPanel.setVisible(false);
            }
        );
        this.shipyardPanel.add(buyBtn2);

        // Close button (error type for close action)
        const closeBtn = UIFactory.createButton(
            this,
            200,
            260,
            'FECHAR',
            'error',
            () => {
                this.shipyardPanel.setVisible(false);
            }
        );
        this.shipyardPanel.add(closeBtn);

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
            const localId = ship.currentLocation?.source_id ?? 'N/A';
            
            const shipInfoText = this.add.text(15, yOffset, 
                `${ship.name}\nStatus: ${ship.status}\nLocal: ${localId}\nCombustível: ${ship.currentFuel}/${ship.maxFuel}`,
                { fontFamily: 'Courier New, monospace', fontSize: 12, color: '#ffffff', lineSpacing: 4 }
            );

            // SELECT button 
            const selectBtn = this.add.rectangle(155, yOffset + 25, 50, 25, UIStyle.PALETTE.STATUS_INFO.bg).setInteractive({ useHandCursor: true });
            const selectText = this.add.text(155, yOffset + 25, 'SEL', { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

            selectBtn.on('pointerover', () => selectBtn.setFillStyle(UIStyle.PALETTE.STATUS_INFO.hover));
            selectBtn.on('pointerout', () => selectBtn.setFillStyle(UIStyle.PALETTE.STATUS_INFO.bg));
            selectBtn.on('pointerdown', () => {
                this.activeShipId = ship.id;
                this.updateFleetPanel(); // Refresh to show visual indicator
            });

            // MERCADO button 
            const marketBtn = this.add.rectangle(200, yOffset + 25, 50, 25, UIStyle.PALETTE.MARKET_ACCENT as any).setInteractive({ useHandCursor: true });
            const marketText = this.add.text(200, yOffset + 25, 'MRC', { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

            marketBtn.on('pointerover', () => marketBtn.setFillStyle(UIStyle.PALETTE.WARNING.hover));
            marketBtn.on('pointerout', () => marketBtn.setFillStyle(UIStyle.PALETTE.MARKET_ACCENT as any));
            marketBtn.on('pointerdown', () => {
                if (ship.status !== 'IDLE') {
                    EventBus.emit('log-event', 'ERRO: A nave precisa estar parada para acessar o mercado.');
                    return;
                }
                EventBus.emit('request-market', ship.id, ship.currentLocation!);
            });

            // FUEL button
            const refuelBtn = this.add.rectangle(245, yOffset + 25, 50, 25, UIStyle.PALETTE.SUCCESS.bg as any).setInteractive({ useHandCursor: true });
            const refuelText = this.add.text(245, yOffset + 25, 'FUEL', { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

            refuelBtn.on('pointerover', () => refuelBtn.setFillStyle(UIStyle.PALETTE.SUCCESS.hover as any));
            refuelBtn.on('pointerout', () => refuelBtn.setFillStyle(UIStyle.PALETTE.SUCCESS.bg as any));
            refuelBtn.on('pointerdown', () => {
                if (ship.status !== 'IDLE') {
                    EventBus.emit('log-event', 'ERRO: A nave deve estar parada para reabastecer.');
                    return;
                }
                if (!ship.currentLocation?.hasStation) {
                    EventBus.emit('log-event', `ERRO: O sistema não possui Estação de Reabastecimento!`);
                    return;
                }
                
                const fuelNeeded = ship.maxFuel - ship.currentFuel;
                if (fuelNeeded <= 0) {
                    EventBus.emit('log-event', 'O tanque já está cheio.');
                    return;
                }
                
                // Tenta comprar. Se a Company tiver créditos, o buyFuel retorna true.
                if (this.company!.buyFuel(ship.id, fuelNeeded)) {
                    this.updateFleetPanel(); // Atualiza os números na tela
                }
            });

            this.fleetPanel.add([shipInfoText, selectBtn, selectText, marketBtn, marketText, refuelBtn, refuelText]);
            yOffset += 80;
        }
    }
    private createRankingPanel() {
        // Use UIFactory to create ranking panel
        this.rankingPanel = UIFactory.createPanel(
            this,
            GameConfig.WIDTH / 2 - 250,
            GameConfig.HEIGHT / 2 - 150,
            500,
            300,
            'RANKING GALÁCTICO',
            'warning'
        );
        this.rankingPanel.setDepth(100);

        // Add close button (error type styled button)
        const closeBtn = UIFactory.createButton(
            this,
            470,
            20,
            '[X]',
            'error',
            () => this.rankingPanel.setVisible(false)
        );
        this.rankingPanel.add(closeBtn);

        // Add ranking text
        this.rankingListText = UIFactory.createText(
            this,
            20,
            60,
            '',
            'body_text'
        );
        this.rankingListText.setOrigin(0, 0);
        this.rankingPanel.add(this.rankingListText);

        this.rankingPanel.setVisible(false);

        // Escuta a resposta do Game.ts e atualiza o texto
        EventBus.on('receive-ranking', (data: any[]) => {
            let text = "POS | EMPRESA              | REP | CRÉDITOS\n";
            text += "-----------------------------------------------\n";
            data.forEach((comp, index) => {
                const prefix = comp.isPlayer ? "-> " : "   ";
                const name = comp.name.padEnd(20, ' ').substring(0, 20);
                text += `${(index + 1).toString().padEnd(3, ' ')} | ${prefix}${name} | ${comp.rep.toString().padEnd(3, ' ')} | ¢${comp.cred.toLocaleString()}\n`;
            });
            this.rankingListText.setText(text);
            this.rankingPanel.setVisible(true);
        });
    }
    private createEventModal() {
        this.eventModal = this.add.container(GameConfig.WIDTH / 2, GameConfig.HEIGHT / 2);
        this.eventModal.setDepth(200);

        const modalStyle = UIStyle.PALETTE.EVENT_MODAL as any;
        const bg = this.add.rectangle(0, 0, 500, 300, modalStyle.bg, 0.95).setStrokeStyle(3, modalStyle.border);
        this.eventTitleText = this.add.text(0, -120, '', { fontFamily: 'Courier New, monospace', fontSize: 22, color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5, 0.5);
        this.eventDescText = this.add.text(0, -50, '', { fontFamily: 'Courier New, monospace', fontSize: 14, color: '#ffffff', wordWrap: { width: 460 }, align: 'center' }).setOrigin(0.5, 0.5);

        this.eventModal.add([bg, this.eventTitleText, this.eventDescText]);
        this.eventModal.setVisible(false);

        EventBus.on('trigger-interactive-event', (data: any) => {
            this.eventTitleText.setText(data.title);
            this.eventDescText.setText(data.description);

            // Limpa os botões antigos
            this.eventButtons.forEach(btn => btn.destroy());
            this.eventButtons = [];

            // Cria novos botões baseados nas escolhas com UIFactory
            let startY = 30;
            data.choices.forEach((choice: any) => {
                const btnContainer = this.add.container(0, startY);
                
                // Use UIFactory for event buttons (modal type)
                const colors = { DEFAULT: { bg: UIStyle.PALETTE.MODAL_BG, text: '#ffffff' }, HOVER: { bg: UIStyle.PALETTE.MODAL_HOVER, text: '#ffffff' } };
                const btnBg = this.add.rectangle(0, 0, 400, 40, colors.DEFAULT.bg as any).setInteractive({ useHandCursor: true });
                const btnText = this.add.text(0, 0, choice.label, UIStyle.TYPOGRAPHY.PRESET.BUTTON_TEXT as any).setOrigin(0.5, 0.5);
                
                btnBg.on('pointerover', () => btnBg.setFillStyle(colors.HOVER.bg as any));
                btnBg.on('pointerout', () => btnBg.setFillStyle(colors.DEFAULT.bg as any));
                btnBg.on('pointerdown', () => {
                    choice.action(); // Execute logic
                    this.eventModal.setVisible(false);
                    EventBus.emit('time-play'); // Unpause game
                    btnBg.setFillStyle(colors.DEFAULT.bg);
                });

                btnContainer.add([btnBg, btnText]);
                this.eventModal.add(btnContainer);
                this.eventButtons.push(btnContainer);
                
                startY += 55;
            });

            this.eventModal.setVisible(true);
        });
    }
}
