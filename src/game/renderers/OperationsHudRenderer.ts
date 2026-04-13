import Phaser from "phaser";
import { CompanyState, Contract } from "../types/AstroTransit";
import { Star } from "../types/MapData";
import { Region } from "../models/Region";

interface ContractRow {
  container: Phaser.GameObjects.Container;
  button: Phaser.GameObjects.Image;
  actionLabel: Phaser.GameObjects.Text;
  text: Phaser.GameObjects.Text;
}

export class OperationsHudRenderer {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly panelBounds = {
    overview: { x: 12, y: 68, width: 320, height: 148 },
    system: { x: 676, y: 68, width: 336, height: 280 },
    fleet: { x: 676, y: 364, width: 336, height: 160 },
    log: { x: 12, y: 586, width: 470, height: 170 }
  };
  private readonly topBarEmpireText: Phaser.GameObjects.Text;
  private readonly topBarDateText: Phaser.GameObjects.Text;
  private readonly topBarCreditsText: Phaser.GameObjects.Text;
  private readonly topBarReputationText: Phaser.GameObjects.Text;
  private readonly topBarFleetText: Phaser.GameObjects.Text;
  private readonly topBarContractsText: Phaser.GameObjects.Text;
  private readonly topBarStatusText: Phaser.GameObjects.Text;
  private readonly overviewText: Phaser.GameObjects.Text;
  private readonly alertsText: Phaser.GameObjects.Text;
  private readonly systemTitle: Phaser.GameObjects.Text;
  private readonly systemBody: Phaser.GameObjects.Text;
  private readonly fleetText: Phaser.GameObjects.Text;
  private readonly logText: Phaser.GameObjects.Text;
  private readonly arisText: Phaser.GameObjects.Text;
  private readonly contractRows: ContractRow[] = [];

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.root = root;

    const topBarTexts = this.createTopBar();
    this.topBarEmpireText = topBarTexts.empire;
    this.topBarDateText = topBarTexts.date;
    this.topBarCreditsText = topBarTexts.credits;
    this.topBarReputationText = topBarTexts.reputation;
    this.topBarFleetText = topBarTexts.fleet;
    this.topBarContractsText = topBarTexts.contracts;
    this.topBarStatusText = topBarTexts.status;

    this.createPanel("overview", "ui-main-panel-compact");
    this.createPanel("system", "ui-main-panel-tall");
    this.createPanel("fleet", "ui-main-panel-compact");
    this.createPanel("log", "ui-main-panel-compact");

    this.createPanelTitle("Visao da Operacao", 24, 78, "ui-title-panel-compact", 183, 20);
    this.createPanelTitle("Sistema em Foco", scene.scale.width - 338, 78, "ui-title-panel-wide", 318, 20);
    this.createPanelTitle("Frota", scene.scale.width - 338, 374, "ui-title-panel-compact", 183, 20);
    this.createPanelTitle("Registro de Bordo", 24, scene.scale.height - 172, "ui-title-panel-wide", 318, 20);

    this.overviewText = this.makeText(26, 104, 12, "#d8fffb", 280).setLineSpacing(2);
    this.alertsText = this.makeText(26, 168, 11, "#ffbf82", 280);
    this.systemTitle = this.makeText(scene.scale.width - 332, 104, 16, "#d6f6f0", 294);
    this.systemBody = this.makeText(scene.scale.width - 332, 134, 12, "#cfe9e5", 294);
    this.fleetText = this.makeText(scene.scale.width - 332, 404, 12, "#d4ece8", 294);
    this.logText = this.makeText(24, scene.scale.height - 142, 12, "#c0d8d4", 430);
    this.arisText = this.makeText(scene.scale.width - 332, 494, 11, "#8fe9d1", 294);

    root.add([
      this.overviewText,
      this.alertsText,
      this.systemTitle,
      this.systemBody,
      this.fleetText,
      this.logText,
      this.arisText
    ]);

    for (let index = 0; index < 4; index += 1) {
      const y = 192 + (index * 42);
      const row = this.createContractRow(scene.scale.width - 332, y);
      this.contractRows.push(row);
      root.add(row.container);
    }
  }

  render(
    state: CompanyState,
    selectedStar: Star | null,
    selectedRegion: Region | null,
    contracts: Contract[],
    starsById: Map<number, Star>,
    regionsById: Map<string, Region>,
    onDispatch: (contractId: string) => void
  ) {
    this.topBarEmpireText.setText("Astro Transit Directorate");
    this.topBarDateText.setText(`D${state.currentDay} . T${state.currentTick}`);
    this.topBarCreditsText.setText(formatCompactNumber(state.credits));
    this.topBarReputationText.setText(`${state.reputation}`);
    this.topBarFleetText.setText(`${state.fleet.length}`);
    this.topBarContractsText.setText(`${state.activeContracts.length}`);
    this.topBarStatusText.setText(state.alerts.length > 0 ? `${state.alerts.length} alertas` : "Estavel");

    this.overviewText.setText([
      `Dia ${state.currentDay}  |  Tick ${state.currentTick}`,
      `Créditos: ${state.credits}`,
      `Reputação: ${state.reputation}`,
      `Frota ativa: ${state.fleet.length}`,
      `Contratos ativos: ${state.activeContracts.length}`
    ]);

    this.alertsText.setText(state.alerts.length > 0 ? state.alerts.join(" | ") : "Status nominal. Nenhum alerta crítico.");
    this.alertsText.setPosition(this.overviewText.x, this.overviewText.y + this.overviewText.height + 8);

    if (selectedStar) {
      this.systemTitle.setText(selectedStar.name ?? `Sistema ${selectedStar.id}`);
      this.systemBody.setText([
        `ID: ${selectedStar.id} | Regiao: ${selectedRegion?.name ?? "Nao mapeada"}`,
        `Coordenadas: ${selectedStar.x.toFixed(0)}, ${selectedStar.y.toFixed(0)}`,
        `Perigo: ${formatPercent(selectedRegion?.stats.danger)} | Pirataria: ${formatPercent(selectedRegion?.stats.piracy)}`,
        `Taxa: ${formatPercent(selectedRegion?.stats.tax)} | Seguranca: ${formatPercent(selectedRegion?.stats.security)}`,
        `Contratos locais: ${contracts.length}`
      ]);
    } else {
      this.systemTitle.setText("Nenhum sistema selecionado");
      this.systemBody.setText("Selecione um sistema no mapa para ver contratos e despachar uma nave.");
    }

    this.contractRows.forEach((row, index) => {
      const contract = contracts[index];
      if (!selectedStar || !contract) {
        row.container.setVisible(false);
        return;
      }

      row.container.setVisible(true);
      const destinationRegion = contract.destinationRegionId ? regionsById.get(contract.destinationRegionId) : undefined;
      row.text.setText([
        `${starsById.get(contract.originStarId)?.name} -> ${starsById.get(contract.destinationStarId)?.name}`,
        `${destinationRegion?.name ?? "Regiao ?"} | Risco ${formatPercent(contract.risk)} | Taxa ${contract.routeTax ?? 0} | ${contract.reward}cr D${contract.deadlineDay}`
      ]);
      row.button.removeAllListeners();
      row.button.setInteractive({ useHandCursor: true });
      row.button.on("pointerover", () => row.container.setScale(1.01));
      row.button.on("pointerout", () => row.container.setScale(1));
      row.button.on("pointerdown", () => onDispatch(contract.id));
      row.actionLabel.setText("Despachar");
    });

    this.fleetText.setText(state.fleet.map((ship) => {
      const destination = ship.task ? starsById.get(ship.task.destinationStarId)?.name : "-";
      const eta = ship.task ? `${ship.task.remainingDays}d` : "-";
      return `${ship.name} | ${ship.status} | Int ${ship.integrity}% | ETA ${eta} | Dest ${destination}`;
    }));

    this.logText.setText(state.logs.slice(-7).map((entry) => `[D${entry.day}] ${entry.message}`));
    this.arisText.setText(
      state.arisMessages.length > 0
        ? `A.R.I.S.: ${state.arisMessages[state.arisMessages.length - 1].message}`
        : "A.R.I.S. aguardando novas diretrizes."
    );
  }

  setVisible(visible: boolean) {
    this.root.setVisible(visible);
  }

  private createContractRow(x: number, y: number): ContractRow {
    const container = this.scene.add.container(0, 0);
    const rowBg = this.scene.add.graphics();
    rowBg.fillStyle(0x08151a, 0.88);
    rowBg.fillRoundedRect(x, y, 304, 36, 10);

    const text = this.makeText(x + 8, y + 5, 10, "#d4ece8", 208);
    const button = this.scene.add.image(x + 254, y + 18, "ui-button-primary").setDisplaySize(84, 28);
    const actionLabel = this.scene.add.text(x + 254, y + 18, "Despachar", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "11px",
      color: "#d8fffb"
    }).setOrigin(0.5);
    container.add([rowBg, text, button, actionLabel]);
    return { container, button, actionLabel, text };
  }

  private makeText(x: number, y: number, size: number, color = "#d4ece8", wordWrapWidth = 304) {
    return this.scene.add.text(x, y, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: `${size}px`,
      color,
      wordWrap: { width: wordWrapWidth }
    });
  }

  private createTopBar() {
    const topBarShadow = this.scene.add.graphics();
    topBarShadow.fillStyle(0x01080b, 0.7);
    topBarShadow.fillRoundedRect(10, 8, this.scene.scale.width - 20, 54, 12);
    this.root.add(topBarShadow);

    const topBar = this.scene.add.image(12, 8, "ui-main-panel-compact").setOrigin(0, 0).setAlpha(0.97);
    topBar.setDisplaySize(this.scene.scale.width - 24, 50);
    this.root.add(topBar);

    const empireAccent = this.scene.add.graphics();
    empireAccent.fillStyle(0x0fdbd1, 0.12);
    empireAccent.fillPoints([
      new Phaser.Geom.Point(24, 18),
      new Phaser.Geom.Point(212, 18),
      new Phaser.Geom.Point(222, 28),
      new Phaser.Geom.Point(214, 42),
      new Phaser.Geom.Point(24, 42)
    ], true);
    const empirePlate = this.scene.add.image(26, 22, "ui-button-bar-active").setOrigin(0, 0);
    empirePlate.setDisplaySize(192, 24);
    const empireLabel = this.scene.add.text(38, 14, "DIRECTORATE", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#6dd7cb",
      letterSpacing: 1
    });
    const empireText = this.scene.add.text(38, 27, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "14px",
      color: "#d9fffa"
    });

    const controlDockShadow = this.scene.add.graphics();
    controlDockShadow.fillStyle(0x02080b, 0.86);
    controlDockShadow.fillRoundedRect(260, 14, 180, 40, 12);
    const controlDockFrame = this.scene.add.image(264, 18, "ui-button-bar-active").setOrigin(0, 0);
    controlDockFrame.setDisplaySize(172, 30).setAlpha(0.84);
    const controlInset = this.scene.add.graphics();
    controlInset.fillStyle(0x031218, 0.9);
    controlInset.fillRoundedRect(270, 22, 160, 22, 8);
    const controlLabel = this.scene.add.text(278, 14, "TEMPORAL FLOW", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#6dd7cb",
      letterSpacing: 1
    });
    const rewindButton = this.createTimeControlButton(280, 24, "time-rewind");
    const pauseButton = this.createTimeControlButton(314, 24, "time-pause");
    const playButton = this.createTimeControlButton(348, 24, "time-play", true);
    const fastForwardButton = this.createTimeControlButton(382, 24, "time-fast-forward");

    const datePlate = this.createTopBarMetric(454, 14, 82, "DATE", true);
    const creditsPlate = this.createTopBarMetric(544, 14, 114, "ENERGY");
    const reputationPlate = this.createTopBarMetric(666, 14, 92, "PRESTIGE");
    const fleetPlate = this.createTopBarMetric(766, 14, 72, "FLEET");
    const contractsPlate = this.createTopBarMetric(846, 14, 72, "JOBS");
    const statusPlate = this.createTopBarMetric(926, 14, 84, "STATUS", true);

    const dateText = this.createTopBarText(468, 31, 12, "#d9fffa");
    const creditsText = this.createTopBarText(558, 31, 12, "#d9fffa");
    const reputationText = this.createTopBarText(680, 31, 12, "#d9fffa");
    const fleetText = this.createTopBarText(780, 31, 12, "#d9fffa");
    const contractsText = this.createTopBarText(860, 31, 12, "#d9fffa");
    const statusText = this.createTopBarText(940, 31, 12, "#d9fffa");

    this.root.add([
      empireAccent,
      empirePlate,
      controlDockShadow,
      controlDockFrame,
      controlInset,
      rewindButton.bg,
      pauseButton.bg,
      playButton.bg,
      fastForwardButton.bg,
      datePlate.plate,
      datePlate.label,
      creditsPlate.plate,
      creditsPlate.label,
      reputationPlate.plate,
      reputationPlate.label,
      fleetPlate.plate,
      fleetPlate.label,
      contractsPlate.plate,
      contractsPlate.label,
      statusPlate.plate,
      statusPlate.label,
      empireLabel,
      empireText,
      controlLabel,
      rewindButton.icon,
      pauseButton.icon,
      playButton.icon,
      fastForwardButton.icon,
      dateText,
      creditsText,
      reputationText,
      fleetText,
      contractsText,
      statusText
    ]);

    return {
      empire: empireText,
      date: dateText,
      credits: creditsText,
      reputation: reputationText,
      fleet: fleetText,
      contracts: contractsText,
      status: statusText
    };
  }

  private createTimeControlButton(x: number, y: number, iconKey: string, active = false) {
    const bg = this.scene.add.image(x, y, active ? "ui-button-bar-active" : "ui-button-bar").setOrigin(0, 0);
    bg.setDisplaySize(26, 18).setAlpha(active ? 1 : 0.85);
    const icon = this.scene.add.image(x + 13, y + 9, iconKey).setDisplaySize(12, 12);
    icon.setAlpha(active ? 1 : 0.92);

    return { bg, icon };
  }

  private createTopBarMetric(x: number, y: number, width: number, label: string, active = false) {
    const plate = this.scene.add.image(x, y + 10, active ? "ui-button-bar-active" : "ui-button-bar").setOrigin(0, 0);
    plate.setDisplaySize(width, 24).setAlpha(active ? 0.98 : 0.88);
    const labelText = this.scene.add.text(x + 10, y, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "8px",
      color: "#6dd7cb",
      letterSpacing: 1
    });

    return { plate, label: labelText };
  }

  private createTopBarText(x: number, y: number, size: number, color: string) {
    return this.scene.add.text(x, y, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: `${size}px`,
      color
    });
  }

  private createPanel(panelKey: keyof OperationsHudRenderer["panelBounds"], texture: string) {
    const bounds = this.panelBounds[panelKey];
    this.createPanelBackdrop(bounds.x, bounds.y, bounds.width, bounds.height);
    const panel = this.scene.add.image(bounds.x, bounds.y, texture).setOrigin(0, 0).setAlpha(0.96);
    panel.setDisplaySize(bounds.width, bounds.height);
    this.root.add(panel);

    if (panelKey === "system" || panelKey === "fleet") {
      const grid = this.scene.add.image(bounds.x + 18, bounds.y + 36, "ui-grid").setOrigin(0, 0).setAlpha(0.08);
      grid.setDisplaySize(bounds.width - 36, bounds.height - 52);
      this.root.add(grid);
    }
  }

  private createPanelBackdrop(x: number, y: number, width: number, height: number) {
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x02080b, 0.72);
    shadow.fillRoundedRect(x + 4, y + 6, width, height, 12);
    this.root.add(shadow);
  }

  private createPanelTitle(text: string, x: number, y: number, texture: string, width: number, height: number) {
    const bar = this.scene.add.image(x, y, texture).setOrigin(0, 0);
    bar.setDisplaySize(width, height);
    const label = this.scene.add.text(x + 12, y + 2, text, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "12px",
      color: "#8fe9d1"
    });
    this.root.add([bar, label]);
  }
}

function formatPercent(value?: number) {
  return value === undefined ? "--" : `${Math.round(value * 100)}%`;
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${value}`;
}
