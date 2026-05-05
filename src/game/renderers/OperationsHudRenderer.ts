import Phaser from "phaser";
import { HUD_CONTRACT_ROW_COUNT, HUD_LAYOUT, HUD_PANEL_BOUNDS } from "./OperationsHudLayout";
import { OperationsHudViewModel } from "../view-models/OperationsHudViewModel";
import { GameAssetKeys } from "../utils/GameAssets";

interface ContractRow {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  button: Phaser.GameObjects.Image;
  actionLabel: Phaser.GameObjects.Text;
  contractId: string | null;
  text: Phaser.GameObjects.Text;
  canDispatch: boolean;
}

interface FleetRow {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  statusIcon: Phaser.GameObjects.Image;
  button: Phaser.GameObjects.Image;
  actionLabel: Phaser.GameObjects.Text;
  shipId: string | null;
  nameText: Phaser.GameObjects.Text;
  detailsText: Phaser.GameObjects.Text;
  canAct: boolean;
  action: "repair" | "relocate" | "rescue" | null;
}

interface ShipyardRow {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  button: Phaser.GameObjects.Image;
  actionLabel: Phaser.GameObjects.Text;
  shipTypeId: string | null;
  nameText: Phaser.GameObjects.Text;
  detailsText: Phaser.GameObjects.Text;
  priceText: Phaser.GameObjects.Text;
  canPurchase: boolean;
}

interface TimeControlButton {
  bg: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
  multiplicador: number;
}

type HudPanelKey = keyof typeof HUD_PANEL_BOUNDS;

const HUD_COLORS = {
  panelFill: 0x031012,
  panelStroke: 0x2c8a83,
  panelAccent: 0xd28a25,
  panelGlow: 0x00e3d1,
  rowFill: 0x061a1d,
  rowStroke: 0x145a58
} as const;

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
  private readonly auditText: Phaser.GameObjects.Text;
  private readonly logAlertBg: Phaser.GameObjects.Rectangle;
  private readonly contractFilterButton: Phaser.GameObjects.Image;
  private readonly contractFilterLabel: Phaser.GameObjects.Text;
  private readonly contractRows: ContractRow[] = [];
  private readonly fleetRows: FleetRow[] = [];
  private readonly shipyardRows: ShipyardRow[] = [];
  private readonly timeControlButtons: TimeControlButton[] = [];
  private readonly panelLayers = {} as Record<HudPanelKey, Phaser.GameObjects.Container>;
  private readonly panelVisibility: Record<HudPanelKey, boolean> = {
    overview: true,
    system: true,
    fleet: true,
    shipyard: true,
    log: true
  };
  private readonly sideNavButtons: Partial<Record<HudPanelKey, Phaser.GameObjects.Image>> = {};
  private onDispatch: (contractId: string) => void = () => undefined;
  private onPurchaseShip: (shipTypeId: string) => void = () => undefined;
  private onCycleContractFilter: () => void = () => undefined;
  private onPreviewContract: (contractId: string | null) => void = () => undefined;
  private onFleetAction: (shipId: string, action: "repair" | "relocate" | "rescue") => void = () => undefined;

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.root = root;

    this.createPanelLayers();
    const topBarTexts = this.createTopBar();
    this.createLeftCommandDock();
    this.createBottomCommandStrip();
    this.topBarEmpireText = topBarTexts.empire;
    this.topBarDateText = topBarTexts.date;
    this.topBarCreditsText = topBarTexts.credits;
    this.topBarReputationText = topBarTexts.reputation;
    this.topBarFleetText = topBarTexts.fleet;
    this.topBarContractsText = topBarTexts.contracts;
    this.topBarStatusText = topBarTexts.status;

    this.createPanel("overview", GameAssetKeys.uiMainPanelCompact);
    this.createPanel("system", GameAssetKeys.uiMainPanelTall);
    this.createPanel("fleet", GameAssetKeys.uiMainPanelCompact);
    this.createPanel("shipyard", GameAssetKeys.uiMainPanelCompact);
    this.createPanel("log", GameAssetKeys.uiMainPanelCompact);

    this.createPanelTitle("overview", HUD_LAYOUT.overviewTitle.text, HUD_LAYOUT.overviewTitle.x, HUD_LAYOUT.overviewTitle.y, GameAssetKeys.uiTitlePanelCompact, HUD_LAYOUT.overviewTitle.width, HUD_LAYOUT.overviewTitle.height);
    this.createPanelTitle("system", HUD_LAYOUT.systemTitle.text, HUD_LAYOUT.systemTitle.x, HUD_LAYOUT.systemTitle.y, GameAssetKeys.uiTitlePanelWide, HUD_LAYOUT.systemTitle.width, HUD_LAYOUT.systemTitle.height);
    this.createPanelTitle("fleet", HUD_LAYOUT.fleetTitle.text, HUD_LAYOUT.fleetTitle.x, HUD_LAYOUT.fleetTitle.y, GameAssetKeys.uiTitlePanelCompact, HUD_LAYOUT.fleetTitle.width, HUD_LAYOUT.fleetTitle.height);
    this.createPanelTitle("shipyard", HUD_LAYOUT.shipyardTitle.text, HUD_LAYOUT.shipyardTitle.x, HUD_LAYOUT.shipyardTitle.y, GameAssetKeys.uiTitlePanelCompact, HUD_LAYOUT.shipyardTitle.width, HUD_LAYOUT.shipyardTitle.height);
    this.createPanelTitle("log", HUD_LAYOUT.logTitle.text, HUD_LAYOUT.logTitle.x, HUD_LAYOUT.logTitle.y, GameAssetKeys.uiTitlePanelWide, HUD_LAYOUT.logTitle.width, HUD_LAYOUT.logTitle.height);

    this.overviewText = this.makeText(HUD_LAYOUT.overviewText.x, HUD_LAYOUT.overviewText.y, HUD_LAYOUT.overviewText.size, "#d8fffb", HUD_LAYOUT.overviewText.width).setLineSpacing(-1).setMaxLines(4);
    this.alertsText = this.makeText(HUD_LAYOUT.alertsText.x, HUD_LAYOUT.alertsText.y, HUD_LAYOUT.alertsText.size, "#ffbf82", HUD_LAYOUT.alertsText.width).setMaxLines(1);
    this.systemTitle = this.makeText(HUD_LAYOUT.systemText.x, HUD_LAYOUT.systemText.titleY, 14, "#d6f6f0", HUD_LAYOUT.systemText.width).setMaxLines(1);
    this.systemBody = this.makeText(HUD_LAYOUT.systemText.x, HUD_LAYOUT.systemText.bodyY, 11, "#cfe9e5", HUD_LAYOUT.systemText.width).setMaxLines(4);
    this.fleetText = this.makeText(HUD_LAYOUT.fleetText.x, HUD_LAYOUT.fleetText.y, 12, "#d4ece8", HUD_LAYOUT.fleetText.width);
    this.logText = this.makeText(HUD_LAYOUT.logTextX, HUD_LAYOUT.logTextY, 10, "#c0d8d4", HUD_LAYOUT.logTextWidth).setMaxLines(6);
    this.auditText = this.makeText(HUD_LAYOUT.arisText.x, HUD_LAYOUT.arisText.y, 9, "#8fe9d1", HUD_LAYOUT.arisText.width).setMaxLines(1);
    this.logAlertBg = scene.add.rectangle(HUD_LAYOUT.logTextX - 6, HUD_LAYOUT.logTextY - 4, HUD_LAYOUT.logTextWidth + 12, 84, 0x5c1218, 0.62).setOrigin(0, 0).setVisible(false);
    this.contractFilterButton = scene.add.image(HUD_LAYOUT.contractFilterButton.x, HUD_LAYOUT.contractFilterButton.y, GameAssetKeys.uiButtonPrimary).setOrigin(0, 0).setDisplaySize(HUD_LAYOUT.contractFilterButton.width, HUD_LAYOUT.contractFilterButton.height);
    this.contractFilterLabel = scene.add.text(
      HUD_LAYOUT.contractFilterButton.x + (HUD_LAYOUT.contractFilterButton.width / 2),
      HUD_LAYOUT.contractFilterButton.y + (HUD_LAYOUT.contractFilterButton.height / 2),
      "",
      {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "10px",
        color: "#d8fffb"
      }
    ).setOrigin(0.5);
    [this.contractFilterButton, this.contractFilterLabel].forEach((target) => {
      target.setInteractive({ useHandCursor: true });
      target.on("pointerdown", () => this.onCycleContractFilter());
      target.on("pointerover", () => this.contractFilterButton.setAlpha(1));
      target.on("pointerout", () => this.contractFilterButton.setAlpha(0.92));
    });

    this.panelLayers.overview.add([
      this.overviewText,
      this.alertsText
    ]);
    this.panelLayers.system.add([
      this.systemTitle,
      this.systemBody,
      this.contractFilterButton,
      this.contractFilterLabel
    ]);
    this.panelLayers.fleet.add([
      this.fleetText,
      this.auditText
    ]);
    this.panelLayers.log.add([
      this.logAlertBg,
      this.logText
    ]);

    for (let index = 0; index < HUD_CONTRACT_ROW_COUNT; index += 1) {
      const y = HUD_LAYOUT.contractRowStartY + (index * HUD_LAYOUT.contractRowGap);
      const row = this.createContractRow(HUD_LAYOUT.contractRowX, y);
      this.contractRows.push(row);
      this.panelLayers.system.add(row.container);
    }

    for (let index = 0; index < 3; index += 1) {
      const y = HUD_LAYOUT.fleetText.y + (index * 30);
      const row = this.createFleetRow(HUD_LAYOUT.fleetText.x, y);
      this.fleetRows.push(row);
      this.panelLayers.fleet.add(row.container);
    }

    for (let index = 0; index < 3; index += 1) {
      const y = HUD_LAYOUT.shipyardRowStartY + (index * HUD_LAYOUT.shipyardRowGap);
      const row = this.createShipyardRow(HUD_LAYOUT.shipyardRowX, y);
      this.shipyardRows.push(row);
      this.panelLayers.shipyard.add(row.container);
    }

    this.applyPanelVisibility();
  }

  render(
    viewModel: OperationsHudViewModel,
    onDispatch: (contractId: string) => void,
    onFleetAction: (shipId: string, action: "repair" | "relocate" | "rescue") => void,
    onPreviewContract: (contractId: string | null) => void = () => undefined,
    onPurchaseShip: (shipTypeId: string) => void = () => undefined,
    onCycleContractFilter: () => void = () => undefined
  ) {
    this.onDispatch = onDispatch;
    this.onFleetAction = onFleetAction;
    this.onPreviewContract = onPreviewContract;
    this.onPurchaseShip = onPurchaseShip;
    this.onCycleContractFilter = onCycleContractFilter;
    this.topBarEmpireText.setText(viewModel.topBar.empire);
    this.topBarDateText.setText(viewModel.topBar.date);
    this.topBarCreditsText.setText(viewModel.topBar.credits);
    this.topBarCreditsText.setColor(viewModel.topBar.crisis ? "#ff4b5f" : "#d9fffa");
    this.topBarReputationText.setText(viewModel.topBar.reputation);
    this.topBarFleetText.setText(viewModel.topBar.fleet);
    this.topBarContractsText.setText(viewModel.topBar.contracts);
    this.topBarStatusText.setText(viewModel.topBar.status);

    this.overviewText.setText(viewModel.overviewLines.slice(0, 4));

    this.alertsText.setText(this.truncateText(viewModel.alertsText, 48));
    this.alertsText.setPosition(HUD_LAYOUT.alertsText.x, HUD_LAYOUT.alertsText.y);
    this.systemTitle.setText(this.truncateText(viewModel.systemTitle, 28));
    this.systemBody.setText(viewModel.systemBodyLines.slice(0, 4).map((line) => this.truncateText(line, 48)));
    this.contractFilterLabel.setText(viewModel.contractFilterLabel.replace("Filtro: ", ""));

    this.contractRows.forEach((row, index) => {
      const contract = viewModel.contracts[index];
      if (!contract) {
        row.contractId = null;
        row.canDispatch = false;
        row.container.setVisible(false);
        return;
      }

      row.container.setVisible(true);
      row.contractId = contract.id;
      row.canDispatch = contract.canDispatch;
      row.icon.setTexture(contract.iconKey);
      row.text.setText([
        this.truncateText(contract.routeLabel, 32),
        this.truncateText(contract.detailsLabel, 38)
      ]);
      row.actionLabel.setText(this.truncateText(contract.actionLabel, 10));
      row.button.setAlpha(contract.canDispatch ? 0.95 : 0.35);
      row.actionLabel.setAlpha(contract.canDispatch ? 1 : 0.5);
      row.button.disableInteractive();
      if (contract.canDispatch) {
        row.button.setInteractive({ useHandCursor: true });
      }
    });

    this.fleetText.setText(viewModel.fleetRows.length > 0 ? [] : viewModel.fleetLines);
    this.fleetRows.forEach((row, index) => {
      const ship = viewModel.fleetRows[index];
      if (!ship) {
        row.shipId = null;
        row.canAct = false;
        row.action = null;
        row.container.setVisible(false);
        return;
      }

      row.container.setVisible(true);
      row.shipId = ship.id;
      row.canAct = ship.canAct;
      row.action = ship.action;
      row.icon.setTexture(ship.iconKey);
      row.statusIcon.setTexture(ship.statusIconKey);
      row.nameText.setText(this.truncateText(ship.name, 20));
      row.detailsText.setText(this.truncateText(ship.detailsLabel, 34));
      row.actionLabel.setText(this.truncateText(ship.actionLabel, 9));
      row.button.setAlpha(ship.canAct ? 0.95 : 0.25);
      row.actionLabel.setAlpha(ship.canAct ? 1 : 0.45);
      row.button.disableInteractive();
      if (ship.canAct) {
        row.button.setInteractive({ useHandCursor: true });
      }
    });
    this.shipyardRows.forEach((row, index) => {
      const shipType = viewModel.shipyardRows[index];
      if (!shipType) {
        row.shipTypeId = null;
        row.canPurchase = false;
        row.container.setVisible(false);
        return;
      }

      row.container.setVisible(true);
      row.shipTypeId = shipType.id;
      row.canPurchase = shipType.canPurchase;
      row.icon.setTexture(shipType.iconKey);
      row.nameText.setText(this.truncateText(shipType.name, 18));
      row.detailsText.setText(this.truncateText(shipType.detailsLabel, 34));
      row.priceText.setText(shipType.priceLabel);
      row.button.setAlpha(shipType.canPurchase ? 0.95 : 0.28);
      row.actionLabel.setAlpha(shipType.canPurchase ? 1 : 0.45);
      row.button.disableInteractive();
      if (shipType.canPurchase) {
        row.button.setInteractive({ useHandCursor: true });
      }
    });
    this.logText.setText(viewModel.logLines.slice(-5).map((line) => this.truncateText(line, 76)));
    this.logText.setColor(viewModel.hasCriticalLogs ? "#ffffff" : "#c0d8d4");
    this.logAlertBg.setVisible(viewModel.hasCriticalLogs);
    this.auditText.setText(this.truncateText(viewModel.auditText, 48));
    this.applyPanelVisibility();
  }

  setVisible(visible: boolean) {
    this.root.setVisible(visible);
  }

  private createContractRow(x: number, y: number): ContractRow {
    const container = this.scene.add.container(0, 0);
    const rowBg = this.scene.add.graphics();
    rowBg.fillStyle(HUD_COLORS.rowFill, 0.82);
    rowBg.fillRect(x, y, HUD_LAYOUT.contractRowWidth, HUD_LAYOUT.contractRowHeight);
    rowBg.lineStyle(1, HUD_COLORS.rowStroke, 0.74);
    rowBg.strokeRect(x, y, HUD_LAYOUT.contractRowWidth, HUD_LAYOUT.contractRowHeight);
    rowBg.fillStyle(HUD_COLORS.panelAccent, 0.78);
    rowBg.fillRect(x, y, 3, HUD_LAYOUT.contractRowHeight);

    const buttonX = x + HUD_LAYOUT.contractRowWidth - (HUD_LAYOUT.contractButtonWidth / 2) - 8;
    const icon = this.scene.add.image(x + 16, y + (HUD_LAYOUT.contractRowHeight / 2), GameAssetKeys.cargoBasicSupplies).setDisplaySize(22, 22);
    const textWidth = HUD_LAYOUT.contractRowWidth - HUD_LAYOUT.contractButtonWidth - 52;
    const text = this.makeText(x + 34, y + 3, 8, "#d4ece8", textWidth).setMaxLines(2).setLineSpacing(-2);
    const button = this.scene.add.image(buttonX, y + (HUD_LAYOUT.contractRowHeight / 2), GameAssetKeys.uiButtonBarActive).setDisplaySize(HUD_LAYOUT.contractButtonWidth, 22);
    button.setInteractive({ useHandCursor: true });
    const actionLabel = this.scene.add.text(buttonX, y + (HUD_LAYOUT.contractRowHeight / 2), "Despachar", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#d8fffb"
    }).setOrigin(0.5);
    const row: ContractRow = { container, icon, button, actionLabel, contractId: null, text, canDispatch: false };
    const previewOn = () => {
      row.container.setScale(1.01);
      this.onPreviewContract(row.contractId);
    };
    const previewOff = () => {
      row.container.setScale(1);
      this.onPreviewContract(null);
    };
    button.on("pointerover", previewOn);
    text.on("pointerover", previewOn);
    button.on("pointerout", previewOff);
    text.on("pointerout", previewOff);
    text.setInteractive({ useHandCursor: false });
    button.on("pointerdown", () => {
      if (row.contractId && row.canDispatch) {
        this.onDispatch(row.contractId);
      }
    });
    container.add([rowBg, icon, text, button, actionLabel]);
    return row;
  }

  private createFleetRow(x: number, y: number): FleetRow {
    const container = this.scene.add.container(0, 0);
    const buttonX = x + HUD_LAYOUT.fleetText.width - 34;
    const rowBg = this.scene.add.graphics();
    rowBg.fillStyle(HUD_COLORS.rowFill, 0.62);
    rowBg.fillRect(x - 2, y - 1, HUD_LAYOUT.fleetText.width + 4, 25);
    rowBg.lineStyle(1, HUD_COLORS.rowStroke, 0.38);
    rowBg.strokeRect(x - 2, y - 1, HUD_LAYOUT.fleetText.width + 4, 25);
    const icon = this.scene.add.image(x + 11, y + 12, GameAssetKeys.shipAstraHauler).setDisplaySize(22, 22);
    const statusIcon = this.scene.add.image(x + 26, y + 21, GameAssetKeys.statusLogs).setDisplaySize(12, 12);
    const nameText = this.makeText(x + 34, y, 10, "#d8fffb", 126).setMaxLines(1);
    const detailsText = this.makeText(x + 34, y + 12, 8, "#a7c8c3", 142).setMaxLines(1);
    const button = this.scene.add.image(buttonX, y + 11, GameAssetKeys.uiButtonBarActive).setDisplaySize(62, 20);
    const actionLabel = this.scene.add.text(buttonX, y + 11, "Reparar", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#d8fffb"
    }).setOrigin(0.5);

    const row: FleetRow = { container, icon, statusIcon, button, actionLabel, shipId: null, nameText, detailsText, canAct: false, action: null };
    button.on("pointerover", () => button.setAlpha(1));
    button.on("pointerout", () => button.setAlpha(row.canAct ? 0.95 : 0.25));
    button.on("pointerdown", () => {
      if (row.shipId && row.action) {
        this.onFleetAction(row.shipId, row.action);
      }
    });
    container.add([rowBg, icon, statusIcon, nameText, detailsText, button, actionLabel]);
    return row;
  }

  private createShipyardRow(x: number, y: number): ShipyardRow {
    const container = this.scene.add.container(0, 0);
    const rowBg = this.scene.add.graphics();
    rowBg.fillStyle(HUD_COLORS.rowFill, 0.82);
    rowBg.fillRect(x, y, HUD_LAYOUT.shipyardRowWidth, HUD_LAYOUT.shipyardRowHeight);
    rowBg.lineStyle(1, HUD_COLORS.rowStroke, 0.7);
    rowBg.strokeRect(x, y, HUD_LAYOUT.shipyardRowWidth, HUD_LAYOUT.shipyardRowHeight);
    const buttonX = x + HUD_LAYOUT.shipyardRowWidth - (HUD_LAYOUT.shipyardButtonWidth / 2) - 8;
    const icon = this.scene.add.image(x + 16, y + 15, GameAssetKeys.shipAstraHauler).setDisplaySize(24, 24);
    const nameText = this.makeText(x + 32, y + 3, 9, "#d8fffb", 108).setMaxLines(1);
    const detailsText = this.makeText(x + 32, y + 15, 8, "#a7c8c3", 124).setMaxLines(1);
    const priceText = this.makeText(buttonX - 48, y + 9, 8, "#8fe9d1", 42).setMaxLines(1);
    const button = this.scene.add.image(buttonX, y + 15, GameAssetKeys.uiButtonBarActive).setDisplaySize(HUD_LAYOUT.shipyardButtonWidth, 20);
    const actionLabel = this.scene.add.text(buttonX, y + 15, "Comprar", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#d8fffb"
    }).setOrigin(0.5);

    const row: ShipyardRow = { container, icon, button, actionLabel, shipTypeId: null, nameText, detailsText, priceText, canPurchase: false };
    button.on("pointerover", () => button.setAlpha(1));
    button.on("pointerout", () => button.setAlpha(row.canPurchase ? 0.95 : 0.28));
    button.on("pointerdown", () => {
      if (row.shipTypeId && row.canPurchase) {
        this.onPurchaseShip(row.shipTypeId);
      }
    });
    container.add([rowBg, icon, nameText, detailsText, priceText, button, actionLabel]);
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

  private truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
  }

  private createTopBar() {
    const topBarShadow = this.scene.add.graphics();
    topBarShadow.fillStyle(0x01080b, 0.88);
    topBarShadow.fillRect(0, 0, this.scene.scale.width, 28);
    topBarShadow.lineStyle(1, HUD_COLORS.panelStroke, 0.5);
    topBarShadow.lineBetween(0, 27, this.scene.scale.width, 27);
    this.root.add(topBarShadow);

    const empireAccent = this.scene.add.graphics();
    empireAccent.fillStyle(0x0fdbd1, 0.12);
    empireAccent.fillPoints([
      new Phaser.Geom.Point(10, 3),
      new Phaser.Geom.Point(244, 3),
      new Phaser.Geom.Point(254, 14),
      new Phaser.Geom.Point(244, 25),
      new Phaser.Geom.Point(10, 25)
    ], true);
    empireAccent.lineStyle(1, HUD_COLORS.panelAccent, 0.52);
    empireAccent.strokePoints([
      new Phaser.Geom.Point(10, 3),
      new Phaser.Geom.Point(244, 3),
      new Phaser.Geom.Point(254, 14),
      new Phaser.Geom.Point(244, 25),
      new Phaser.Geom.Point(10, 25)
    ], true);
    const empirePlate = this.scene.add.image(36, 7, GameAssetKeys.uiButtonBarActive).setOrigin(0, 0);
    empirePlate.setDisplaySize(188, 16).setAlpha(0.42);
    const empireIcon = this.scene.add.image(22, 14, GameAssetKeys.statusLogs).setDisplaySize(18, 18);
    const empireLabel = this.scene.add.text(42, 4, "ASTRO TRANSIT", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "7px",
      color: "#6dd7cb",
      letterSpacing: 1
    });
    const empireText = this.scene.add.text(42, 14, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#d9fffa"
    });

    const controlDockShadow = this.scene.add.graphics();
    controlDockShadow.fillStyle(0x02080b, 0.86);
    controlDockShadow.fillRect(270, 4, 124, 20);
    controlDockShadow.lineStyle(1, HUD_COLORS.panelStroke, 0.58);
    controlDockShadow.strokeRect(270, 4, 124, 20);
    const controlDockFrame = this.scene.add.image(274, 8, GameAssetKeys.uiButtonBarActive).setOrigin(0, 0);
    controlDockFrame.setDisplaySize(116, 12).setAlpha(0.18);
    const controlInset = this.scene.add.graphics();
    controlInset.fillStyle(0x031218, 0.9);
    controlInset.fillRect(278, 9, 108, 10);
    const controlLabel = this.scene.add.text(274, 2, "TEMPO", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "7px",
      color: "#6dd7cb",
      letterSpacing: 1
    });
    const pauseButton = this.createTimeControlButton(280, 10, GameAssetKeys.timePause, 0);
    const playButton = this.createTimeControlButton(306, 10, GameAssetKeys.timePlay, 1, true);
    const fastForwardButton = this.createTimeControlButton(332, 10, GameAssetKeys.timeFastForward, 2, false, "2x");
    const hyperForwardButton = this.createTimeControlButton(358, 10, GameAssetKeys.timeFastForward, 4, false, "4x");

    const creditsPlate = this.createTopBarMetric(420, 3, 102, GameAssetKeys.cargoBasicSupplies);
    const reputationPlate = this.createTopBarMetric(530, 3, 82, GameAssetKeys.statusLogs);
    const fleetPlate = this.createTopBarMetric(620, 3, 68, GameAssetKeys.shipAstraHauler);
    const contractsPlate = this.createTopBarMetric(696, 3, 72, GameAssetKeys.cargoFragile);
    const statusPlate = this.createTopBarMetric(776, 3, 116, GameAssetKeys.statusRepair);
    const datePlate = this.createTopBarMetric(this.scene.scale.width - 154, 3, 86, GameAssetKeys.statusEmergency);

    const creditsText = this.createTopBarText(442, 11, 10, "#d9fffa");
    const reputationText = this.createTopBarText(552, 11, 10, "#d9fffa");
    const fleetText = this.createTopBarText(642, 11, 10, "#d9fffa");
    const contractsText = this.createTopBarText(718, 11, 10, "#d9fffa");
    const statusText = this.createTopBarText(798, 11, 10, "#d9fffa");
    const dateText = this.createTopBarText(this.scene.scale.width - 132, 11, 10, "#d9fffa");

    const topBarObjects: Phaser.GameObjects.GameObject[] = [
      empireAccent,
      empirePlate,
      empireIcon,
      controlDockShadow,
      controlDockFrame,
      controlInset,
      pauseButton.bg,
      playButton.bg,
      fastForwardButton.bg,
      hyperForwardButton.bg,
      creditsPlate.icon,
      creditsPlate.plate,
      reputationPlate.icon,
      reputationPlate.plate,
      fleetPlate.icon,
      fleetPlate.plate,
      contractsPlate.icon,
      contractsPlate.plate,
      statusPlate.icon,
      statusPlate.plate,
      datePlate.icon,
      datePlate.plate,
      empireLabel,
      empireText,
      controlLabel,
      pauseButton.icon,
      playButton.icon,
      fastForwardButton.icon,
      hyperForwardButton.icon,
      creditsText,
      reputationText,
      fleetText,
      contractsText,
      statusText,
      dateText
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
    const bg = this.scene.add.image(x, y, active ? GameAssetKeys.uiButtonBarActive : GameAssetKeys.uiButtonBar).setOrigin(0, 0);
    bg.setDisplaySize(20, 12).setAlpha(active ? 1 : 0.82);
    const icon = this.scene.add.image(x + 10, y + 6, iconKey).setDisplaySize(8, 8);
    icon.setAlpha(active ? 1 : 0.92);
    const labelText = label
      ? this.scene.add.text(x + 15, y + 7, label, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "6px",
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
      button.bg.setTexture(active ? GameAssetKeys.uiButtonBarActive : GameAssetKeys.uiButtonBar).setAlpha(active ? 1 : 0.85);
      button.icon.setAlpha(active ? 1 : 0.92);
      button.label?.setAlpha(active ? 1 : 0.82);
    });
  }

  private isTimeControlActive(button: TimeControlButton) {
    return button.bg.texture.key === GameAssetKeys.uiButtonBarActive;
  }

  private createTopBarMetric(x: number, y: number, width: number, iconKey: string) {
    const plate = this.scene.add.image(x, y + 4, GameAssetKeys.uiButtonBar).setOrigin(0, 0);
    plate.setDisplaySize(width, 17).setAlpha(0.34);
    const icon = this.scene.add.image(x + 12, y + 13, iconKey).setDisplaySize(12, 12).setAlpha(0.92);

    return { plate, icon };
  }

  private createTopBarText(x: number, y: number, size: number, color: string) {
    return this.scene.add.text(x, y, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: `${size}px`,
      color
    });
  }

  private createPanelLayers() {
    (Object.keys(HUD_PANEL_BOUNDS) as HudPanelKey[]).forEach((panelKey) => {
      const layer = this.scene.add.container(0, 0);
      this.panelLayers[panelKey] = layer;
      this.root.add(layer);
    });
  }

  private createLeftCommandDock() {
    const dock = this.scene.add.graphics();
    dock.fillStyle(0x020b0d, 0.88);
    dock.fillRect(0, 42, 30, 296);
    dock.lineStyle(1, HUD_COLORS.panelStroke, 0.5);
    dock.lineBetween(29, 42, 29, 338);
    dock.lineBetween(0, 42, 30, 42);
    dock.lineBetween(0, 338, 30, 338);
    this.root.add(dock);

    const buttons: { panelKey: HudPanelKey; iconKey: string }[] = [
      { panelKey: "overview", iconKey: GameAssetKeys.statusLogs },
      { panelKey: "system", iconKey: GameAssetKeys.cargoBasicSupplies },
      { panelKey: "fleet", iconKey: GameAssetKeys.shipAstraHauler },
      { panelKey: "shipyard", iconKey: GameAssetKeys.statusRepair },
      { panelKey: "log", iconKey: GameAssetKeys.statusEmergency }
    ];

    buttons.forEach(({ panelKey, iconKey }, index) => {
      const y = 58 + (index * 34);
      const plate = this.scene.add.image(3, y - 10, GameAssetKeys.uiButtonBarActive).setOrigin(0, 0);
      plate.setDisplaySize(24, 24).setAlpha(0.95);
      const icon = this.scene.add.image(15, y + 2, iconKey).setDisplaySize(15, 15).setAlpha(0.9);
      this.sideNavButtons[panelKey] = plate;
      [plate, icon].forEach((target) => {
        target.setInteractive({ useHandCursor: true });
        target.on("pointerdown", () => this.togglePanel(panelKey));
        target.on("pointerover", () => plate.setAlpha(1));
        target.on("pointerout", () => this.updateSideNavButton(panelKey));
      });
      this.root.add([plate, icon]);
    });
  }

  private togglePanel(panelKey: HudPanelKey) {
    this.panelVisibility[panelKey] = !this.panelVisibility[panelKey];
    this.applyPanelVisibility();
  }

  private applyPanelVisibility() {
    (Object.keys(this.panelLayers) as HudPanelKey[]).forEach((panelKey) => {
      this.panelLayers[panelKey].setVisible(this.panelVisibility[panelKey]);
      this.updateSideNavButton(panelKey);
    });
  }

  private updateSideNavButton(panelKey: HudPanelKey) {
    const button = this.sideNavButtons[panelKey];
    if (!button) {
      return;
    }

    const active = this.panelVisibility[panelKey];
    button.setTexture(active ? GameAssetKeys.uiButtonBarActive : GameAssetKeys.uiButtonBar);
    button.setAlpha(active ? 0.95 : 0.48);
  }

  private createBottomCommandStrip() {
    const strip = this.scene.add.graphics();
    const x = 514;
    const y = 642;
    const width = 372;
    const height = 44;
    strip.fillStyle(0x020b0d, 0.86);
    strip.fillPoints([
      new Phaser.Geom.Point(x + 28, y),
      new Phaser.Geom.Point(x + width - 28, y),
      new Phaser.Geom.Point(x + width, y + 16),
      new Phaser.Geom.Point(x + width - 24, y + height),
      new Phaser.Geom.Point(x + 24, y + height),
      new Phaser.Geom.Point(x, y + 16)
    ], true);
    strip.lineStyle(2, HUD_COLORS.panelAccent, 0.58);
    strip.strokePoints([
      new Phaser.Geom.Point(x + 28, y),
      new Phaser.Geom.Point(x + width - 28, y),
      new Phaser.Geom.Point(x + width, y + 16),
      new Phaser.Geom.Point(x + width - 24, y + height),
      new Phaser.Geom.Point(x + 24, y + height),
      new Phaser.Geom.Point(x, y + 16)
    ], true);
    strip.lineStyle(1, HUD_COLORS.panelStroke, 0.44);
    strip.lineBetween(x + 36, y + 27, x + width - 36, y + 27);

    const label = this.scene.add.text(x + (width / 2), y + 10, "ASTRO TRANSIT", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#d28a25"
    }).setOrigin(0.5);
    const subLabel = this.scene.add.text(x + (width / 2), y + 29, "Comando de rotas hiperespaciais", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "9px",
      color: "#8fe9d1"
    }).setOrigin(0.5);

    this.root.add([strip, label, subLabel]);
  }

  private createPanel(panelKey: HudPanelKey, texture: string) {
    const bounds = HUD_PANEL_BOUNDS[panelKey];
    this.createPanelBackdrop(panelKey, bounds.x, bounds.y, bounds.width, bounds.height);
    const panel = this.scene.add.image(bounds.x, bounds.y, texture).setOrigin(0, 0).setAlpha(0.2);
    panel.setDisplaySize(bounds.width, bounds.height);
    const frame = this.scene.add.graphics();
    frame.fillStyle(HUD_COLORS.panelFill, 0.92);
    frame.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    frame.lineStyle(1, HUD_COLORS.panelStroke, 0.58);
    frame.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    frame.lineStyle(2, HUD_COLORS.panelAccent, 0.48);
    frame.lineBetween(bounds.x, bounds.y, bounds.x + 34, bounds.y);
    frame.lineBetween(bounds.x + bounds.width - 34, bounds.y, bounds.x + bounds.width, bounds.y);
    frame.lineBetween(bounds.x, bounds.y + bounds.height, bounds.x + 34, bounds.y + bounds.height);
    frame.lineBetween(bounds.x + bounds.width - 34, bounds.y + bounds.height, bounds.x + bounds.width, bounds.y + bounds.height);
    this.panelLayers[panelKey].add([panel, frame]);

    if (panelKey === "system" || panelKey === "fleet" || panelKey === "shipyard") {
      const grid = this.scene.add.image(bounds.x + 18, bounds.y + 36, GameAssetKeys.uiGrid).setOrigin(0, 0).setAlpha(0.04);
      grid.setDisplaySize(bounds.width - 36, bounds.height - 52);
      this.panelLayers[panelKey].add(grid);
    }
  }

  private createPanelBackdrop(panelKey: HudPanelKey, x: number, y: number, width: number, height: number) {
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x02080b, 0.72);
    shadow.fillRect(x + 4, y + 6, width, height);
    this.panelLayers[panelKey].add(shadow);
  }

  private createPanelTitle(panelKey: HudPanelKey, text: string, x: number, y: number, texture: string, width: number, height: number) {
    const bar = this.scene.add.image(x, y, texture).setOrigin(0, 0).setAlpha(0.35);
    bar.setDisplaySize(width, height);
    const rule = this.scene.add.graphics();
    rule.fillStyle(0x0b2f31, 0.74);
    rule.fillRect(x, y, width, height);
    rule.lineStyle(1, HUD_COLORS.panelGlow, 0.34);
    rule.lineBetween(x, y + height, x + width, y + height);
    const label = this.scene.add.text(x + 10, y + 2, text, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "10px",
      color: "#8fe9d1"
    });
    this.panelLayers[panelKey].add([bar, rule, label]);
  }
}
