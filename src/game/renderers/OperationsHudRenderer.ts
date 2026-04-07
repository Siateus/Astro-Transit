import Phaser from "phaser";
import { CompanyState, Contract } from "../types/AstroTransit";
import { Star } from "../types/MapData";
import { Region } from "../models/Region";

interface ContractRow {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

export class OperationsHudRenderer {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
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

    this.createPanel(12, 12, 320, 92);
    this.createPanel(scene.scale.width - 348, 12, 336, 280);
    this.createPanel(scene.scale.width - 348, 308, 336, 160);
    this.createPanel(12, scene.scale.height - 182, 470, 170);

    this.overviewText = this.makeText(24, 24, 12);
    this.alertsText = this.makeText(24, 78, 11, "#ffba7a");
    this.systemTitle = this.makeText(scene.scale.width - 332, 24, 16, "#d6f6f0");
    this.systemBody = this.makeText(scene.scale.width - 332, 54, 12);
    this.fleetText = this.makeText(scene.scale.width - 332, 320, 12);
    this.logText = this.makeText(24, scene.scale.height - 168, 12, "#c0d8d4");
    this.arisText = this.makeText(scene.scale.width - 332, 440, 11, "#8fe9d1");

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
      const y = 124 + (index * 42);
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
    this.overviewText.setText([
      `Dia ${state.currentDay}  |  Tick ${state.currentTick}`,
      `Créditos: ${state.credits}`,
      `Reputação: ${state.reputation}`,
      `Frota ativa: ${state.fleet.length}`,
      `Contratos ativos: ${state.activeContracts.length}`
    ]);

    this.alertsText.setText(state.alerts.length > 0 ? state.alerts.join(" | ") : "Status nominal. Nenhum alerta crítico.");

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
      row.bg.removeAllListeners();
      row.bg.setInteractive({ useHandCursor: true });
      row.bg.on("pointerdown", () => onDispatch(contract.id));
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

  private createPanel(x: number, y: number, width: number, height: number) {
    const g = this.scene.add.graphics();
    g.fillStyle(0x0e171b, 0.92);
    g.lineStyle(1, 0x4d7e84, 0.75);
    g.fillRoundedRect(x, y, width, height, 6);
    g.strokeRoundedRect(x, y, width, height, 6);
    this.root.add(g);
  }

  private createContractRow(x: number, y: number): ContractRow {
    const container = this.scene.add.container(0, 0);
    const bg = this.scene.add.rectangle(x, y, 304, 36, 0x1c2b30, 0.96).setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x4d7e84, 0.65);
    const text = this.makeText(x + 8, y + 4, 10, "#d4ece8");
    container.add([bg, text]);
    return { container, bg, text };
  }

  private makeText(x: number, y: number, size: number, color = "#d4ece8") {
    return this.scene.add.text(x, y, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: `${size}px`,
      color,
      wordWrap: { width: 304 }
    });
  }
}

function formatPercent(value?: number) {
  return value === undefined ? "--" : `${Math.round(value * 100)}%`;
}
