import Phaser from "phaser";
import { HUD_CONTRACT_ROW_COUNT, HUD_LAYOUT, HUD_PANEL_BOUNDS } from "./OperationsHudLayout";
import { OperationsHudViewModel } from "../view-models/OperationsHudViewModel";

interface ContractRow {
  container: Phaser.GameObjects.Container;
  button: Phaser.GameObjects.Image;
  actionLabel: Phaser.GameObjects.Text;
  contractId: string | null;
  text: Phaser.GameObjects.Text;
}

interface FleetRow {
  container: Phaser.GameObjects.Container;
  button: Phaser.GameObjects.Image;
  actionLabel: Phaser.GameObjects.Text;
  shipId: string | null;
  nameText: Phaser.GameObjects.Text;
  detailsText: Phaser.GameObjects.Text;
  canRepair: boolean;
}

interface TimeControlButton {
  bg: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
  multiplicador: number;
}

export class OperationsHudRenderer {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
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
  private readonly fleetRows: FleetRow[] = [];
  private readonly timeControlButtons: TimeControlButton[] = [];
  private onDispatch: (contractId: string) => void = () => undefined;
  private onRepair: (shipId: string) => void = () => undefined;

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

    this.createPanelTitle(HUD_LAYOUT.overviewTitle.text, HUD_LAYOUT.overviewTitle.x, HUD_LAYOUT.overviewTitle.y, "ui-title-panel-compact", HUD_LAYOUT.overviewTitle.width, HUD_LAYOUT.overviewTitle.height);
    this.createPanelTitle(HUD_LAYOUT.systemTitle.text, HUD_LAYOUT.systemTitle.x, HUD_LAYOUT.systemTitle.y, "ui-title-panel-wide", HUD_LAYOUT.systemTitle.width, HUD_LAYOUT.systemTitle.height);
    this.createPanelTitle(HUD_LAYOUT.fleetTitle.text, HUD_LAYOUT.fleetTitle.x, HUD_LAYOUT.fleetTitle.y, "ui-title-panel-compact", HUD_LAYOUT.fleetTitle.width, HUD_LAYOUT.fleetTitle.height);
    this.createPanelTitle(HUD_LAYOUT.logTitle.text, HUD_LAYOUT.logTitle.x, HUD_LAYOUT.logTitle.y, "ui-title-panel-wide", HUD_LAYOUT.logTitle.width, HUD_LAYOUT.logTitle.height);

    this.overviewText = this.makeText(HUD_LAYOUT.overviewText.x, HUD_LAYOUT.overviewText.y, HUD_LAYOUT.overviewText.size, "#d8fffb", HUD_LAYOUT.overviewText.width).setLineSpacing(2);
    this.alertsText = this.makeText(HUD_LAYOUT.alertsText.x, HUD_LAYOUT.alertsText.y, HUD_LAYOUT.alertsText.size, "#ffbf82", HUD_LAYOUT.alertsText.width);
    this.systemTitle = this.makeText(HUD_LAYOUT.systemText.x, HUD_LAYOUT.systemText.titleY, 16, "#d6f6f0", HUD_LAYOUT.systemText.width);
    this.systemBody = this.makeText(HUD_LAYOUT.systemText.x, HUD_LAYOUT.systemText.bodyY, 12, "#cfe9e5", HUD_LAYOUT.systemText.width);
    this.fleetText = this.makeText(HUD_LAYOUT.fleetText.x, HUD_LAYOUT.fleetText.y, 12, "#d4ece8", HUD_LAYOUT.fleetText.width);
    this.logText = this.makeText(HUD_LAYOUT.logTextX, HUD_LAYOUT.logTextY, 12, "#c0d8d4", HUD_LAYOUT.logTextWidth);
    this.arisText = this.makeText(HUD_LAYOUT.arisText.x, HUD_LAYOUT.arisText.y, 11, "#8fe9d1", HUD_LAYOUT.arisText.width);

    root.add([
      this.overviewText,
      this.alertsText,
      this.systemTitle,
      this.systemBody,
      this.fleetText,
      this.logText,
      this.arisText
    ]);

    for (let index = 0; index < HUD_CONTRACT_ROW_COUNT; index += 1) {
      const y = HUD_LAYOUT.contractRowStartY + (index * HUD_LAYOUT.contractRowGap);
      const row = this.createContractRow(HUD_LAYOUT.contractRowX, y);
      this.contractRows.push(row);
      root.add(row.container);
    }

    for (let index = 0; index < 3; index += 1) {
      const y = HUD_LAYOUT.fleetText.y + (index * 30);
      const row = this.createFleetRow(HUD_LAYOUT.fleetText.x, y);
      this.fleetRows.push(row);
      root.add(row.container);
    }
  }

  render(
    viewModel: OperationsHudViewModel,
    onDispatch: (contractId: string) => void,
    onRepair: (shipId: string) => void
  ) {
    this.onDispatch = onDispatch;
    this.onRepair = onRepair;
    this.topBarEmpireText.setText(viewModel.topBar.empire);
    this.topBarDateText.setText(viewModel.topBar.date);
    this.topBarCreditsText.setText(viewModel.topBar.credits);
    this.topBarReputationText.setText(viewModel.topBar.reputation);
    this.topBarFleetText.setText(viewModel.topBar.fleet);
    this.topBarContractsText.setText(viewModel.topBar.contracts);
    this.topBarStatusText.setText(viewModel.topBar.status);

    this.overviewText.setText(viewModel.overviewLines);

    this.alertsText.setText(viewModel.alertsText);
    this.alertsText.setPosition(this.overviewText.x, this.overviewText.y + this.overviewText.height + 8);
    this.systemTitle.setText(viewModel.systemTitle);
    this.systemBody.setText(viewModel.systemBodyLines);

    this.contractRows.forEach((row, index) => {
      const contract = viewModel.contracts[index];
      if (!contract) {
        row.contractId = null;
        row.container.setVisible(false);
        return;
      }

      row.container.setVisible(true);
      row.contractId = contract.id;
      row.text.setText([
        contract.routeLabel,
        contract.detailsLabel
      ]);
      row.actionLabel.setText(contract.actionLabel);
    });

    this.fleetText.setText(viewModel.fleetRows.length > 0 ? [] : viewModel.fleetLines);
    this.fleetRows.forEach((row, index) => {
      const ship = viewModel.fleetRows[index];
      if (!ship) {
        row.shipId = null;
        row.canRepair = false;
        row.container.setVisible(false);
        return;
      }

      row.container.setVisible(true);
      row.shipId = ship.id;
      row.canRepair = ship.canRepair;
      row.nameText.setText(ship.name);
      row.detailsText.setText(ship.detailsLabel);
      row.actionLabel.setText(ship.actionLabel);
      row.button.setAlpha(ship.canRepair ? 0.95 : 0.35);
      row.actionLabel.setAlpha(ship.canRepair ? 1 : 0.45);
      row.button.disableInteractive();
      if (ship.canRepair) {
        row.button.setInteractive({ useHandCursor: true });
      }
    });
    this.logText.setText(viewModel.logLines);
    this.arisText.setText(viewModel.arisText);
  }

  setVisible(visible: boolean) {
    this.root.setVisible(visible);
  }

  private createContractRow(x: number, y: number): ContractRow {
    const container = this.scene.add.container(0, 0);
    const rowBg = this.scene.add.graphics();
    rowBg.fillStyle(0x08151a, 0.88);
    rowBg.fillRoundedRect(x, y, HUD_LAYOUT.contractRowWidth, HUD_LAYOUT.contractRowHeight, 10);

    const buttonX = x + HUD_LAYOUT.contractRowWidth - (HUD_LAYOUT.contractButtonWidth / 2) - 8;
    const textWidth = HUD_LAYOUT.contractRowWidth - HUD_LAYOUT.contractButtonWidth - 20;
    const text = this.makeText(x + 8, y + 5, 10, "#d4ece8", textWidth);
    const button = this.scene.add.image(buttonX, y + (HUD_LAYOUT.contractRowHeight / 2), "ui-button-primary").setDisplaySize(HUD_LAYOUT.contractButtonWidth, 28);
    button.setInteractive({ useHandCursor: true });
    const actionLabel = this.scene.add.text(buttonX, y + (HUD_LAYOUT.contractRowHeight / 2), "Despachar", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "11px",
      color: "#d8fffb"
    }).setOrigin(0.5);
    const row: ContractRow = { container, button, actionLabel, contractId: null, text };
    button.on("pointerover", () => row.container.setScale(1.01));
    button.on("pointerout", () => row.container.setScale(1));
    button.on("pointerdown", () => {
      if (row.contractId) {
        this.onDispatch(row.contractId);
      }
    });
    container.add([rowBg, text, button, actionLabel]);
    return row;
  }

  private createFleetRow(x: number, y: number): FleetRow {
    const container = this.scene.add.container(0, 0);
    const buttonX = x + HUD_LAYOUT.fleetText.width - 34;
    const nameText = this.makeText(x, y, 11, "#d8fffb", 190);
    const detailsText = this.makeText(x, y + 13, 9, "#a7c8c3", 220);
    const button = this.scene.add.image(buttonX, y + 11, "ui-button-primary").setDisplaySize(68, 22);
    const actionLabel = this.scene.add.text(buttonX, y + 11, "Reparar", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "10px",
      color: "#d8fffb"
    }).setOrigin(0.5);

    const row: FleetRow = { container, button, actionLabel, shipId: null, nameText, detailsText, canRepair: false };
    button.on("pointerover", () => button.setAlpha(1));
    button.on("pointerout", () => button.setAlpha(row.canRepair ? 0.95 : 0.35));
    button.on("pointerdown", () => {
      if (row.shipId) {
        this.onRepair(row.shipId);
      }
    });
    container.add([nameText, detailsText, button, actionLabel]);
    return row;
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
    const pauseButton = this.createTimeControlButton(280, 24, "time-pause", 0);
    const playButton = this.createTimeControlButton(314, 24, "time-play", 1, true);
    const fastForwardButton = this.createTimeControlButton(348, 24, "time-fast-forward", 2, false, "2x");
    const hyperForwardButton = this.createTimeControlButton(382, 24, "time-fast-forward", 4, false, "4x");

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

    const topBarObjects: Phaser.GameObjects.GameObject[] = [
      empireAccent,
      empirePlate,
      controlDockShadow,
      controlDockFrame,
      controlInset,
      pauseButton.bg,
      playButton.bg,
      fastForwardButton.bg,
      hyperForwardButton.bg,
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
      pauseButton.icon,
      playButton.icon,
      fastForwardButton.icon,
      hyperForwardButton.icon,
      dateText,
      creditsText,
      reputationText,
      fleetText,
      contractsText,
      statusText
    ];

    if (fastForwardButton.label) {
      topBarObjects.push(fastForwardButton.label);
    }

    if (hyperForwardButton.label) {
      topBarObjects.push(hyperForwardButton.label);
    }

    this.root.add(topBarObjects);

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

  private createTimeControlButton(
    x: number,
    y: number,
    iconKey: string,
    multiplicador: number,
    active = false,
    label?: string
  ): TimeControlButton {
    const bg = this.scene.add.image(x, y, active ? "ui-button-bar-active" : "ui-button-bar").setOrigin(0, 0);
    bg.setDisplaySize(26, 18).setAlpha(active ? 1 : 0.85);
    const icon = this.scene.add.image(x + 13, y + 9, iconKey).setDisplaySize(12, 12);
    icon.setAlpha(active ? 1 : 0.92);
    const labelText = label
      ? this.scene.add.text(x + 19, y + 10, label, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "7px",
        color: "#d8fffb"
      }).setOrigin(0.5)
      : undefined;

    const button: TimeControlButton = { bg, icon, label: labelText, multiplicador };
    this.timeControlButtons.push(button);

    [bg, icon, labelText].forEach((target) => {
      if (!target) {
        return;
      }

      target.setInteractive({ useHandCursor: true });
      target.on("pointerover", () => bg.setAlpha(1));
      target.on("pointerout", () => {
        if (!this.isTimeControlActive(button)) {
          bg.setAlpha(0.85);
        }
      });
      target.on("pointerdown", () => this.handleTimeControlClick(button));
    });

    return button;
  }

  private handleTimeControlClick(button: TimeControlButton) {
    const scene = this.scene as Phaser.Scene & { ajustarVelocidade?: (multiplicador: number) => void };
    scene.ajustarVelocidade?.(button.multiplicador);
    this.setActiveTimeControl(button.multiplicador);
  }

  private setActiveTimeControl(multiplicador: number) {
    this.timeControlButtons.forEach((button) => {
      const active = button.multiplicador === multiplicador;
      button.bg.setTexture(active ? "ui-button-bar-active" : "ui-button-bar").setAlpha(active ? 1 : 0.85);
      button.icon.setAlpha(active ? 1 : 0.92);
      button.label?.setAlpha(active ? 1 : 0.82);
    });
  }

  private isTimeControlActive(button: TimeControlButton) {
    return button.bg.texture.key === "ui-button-bar-active";
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

  private createPanel(panelKey: keyof typeof HUD_PANEL_BOUNDS, texture: string) {
    const bounds = HUD_PANEL_BOUNDS[panelKey];
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
