const TITLE_BAR_OFFSET_Y = 10;
const PANEL_TEXT_PADDING_X = 14;
const PANEL_TEXT_PADDING_Y = 36;
const PANEL_TEXT_WIDTH_OFFSET = 42;
const LOG_TEXT_WIDTH_OFFSET = 40;
const CONTRACT_ROW_HEIGHT = 36;
const CONTRACT_ROW_GAP = 42;
const CONTRACT_ROW_TOP_OFFSET = 124;

export const HUD_PANEL_BOUNDS = {
  overview: { x: 12, y: 68, width: 320, height: 148 },
  system: { x: 676, y: 68, width: 336, height: 280 },
  fleet: { x: 676, y: 364, width: 336, height: 160 },
  log: { x: 12, y: 586, width: 470, height: 170 }
} as const;

export const HUD_CONTRACT_ROW_COUNT = 4;

const systemPanel = HUD_PANEL_BOUNDS.system;
const fleetPanel = HUD_PANEL_BOUNDS.fleet;
const overviewPanel = HUD_PANEL_BOUNDS.overview;
const logPanel = HUD_PANEL_BOUNDS.log;

export const HUD_LAYOUT = {
  overviewTitle: {
    x: overviewPanel.x + 12,
    y: overviewPanel.y + TITLE_BAR_OFFSET_Y,
    width: 183,
    height: 20,
    text: "Visao da Operacao"
  },
  systemTitle: {
    x: systemPanel.x + (systemPanel.width - 318) / 2,
    y: systemPanel.y + TITLE_BAR_OFFSET_Y,
    width: 318,
    height: 20,
    text: "Sistema em Foco"
  },
  fleetTitle: {
    x: fleetPanel.x + (fleetPanel.width - 183) / 2,
    y: fleetPanel.y + TITLE_BAR_OFFSET_Y,
    width: 183,
    height: 20,
    text: "Frota"
  },
  logTitle: {
    x: logPanel.x + (logPanel.width - 318) / 2,
    y: logPanel.y + TITLE_BAR_OFFSET_Y,
    width: 318,
    height: 20,
    text: "Registro de Bordo"
  },
  overviewText: {
    x: overviewPanel.x + PANEL_TEXT_PADDING_X,
    y: overviewPanel.y + PANEL_TEXT_PADDING_Y,
    width: overviewPanel.width - 40,
    size: 12
  },
  alertsText: {
    x: overviewPanel.x + PANEL_TEXT_PADDING_X,
    y: overviewPanel.y + 100,
    width: overviewPanel.width - 40,
    size: 11
  },
  systemText: {
    x: systemPanel.x + PANEL_TEXT_PADDING_X,
    titleY: systemPanel.y + PANEL_TEXT_PADDING_Y,
    bodyY: systemPanel.y + PANEL_TEXT_PADDING_Y + 30,
    width: systemPanel.width - PANEL_TEXT_WIDTH_OFFSET
  },
  fleetText: {
    x: fleetPanel.x + PANEL_TEXT_PADDING_X,
    y: fleetPanel.y + PANEL_TEXT_PADDING_Y,
    width: fleetPanel.width - PANEL_TEXT_WIDTH_OFFSET
  },
  arisText: {
    x: fleetPanel.x + PANEL_TEXT_PADDING_X,
    y: fleetPanel.y + fleetPanel.height - 34,
    width: fleetPanel.width - PANEL_TEXT_WIDTH_OFFSET
  },
  logTextX: logPanel.x + 12,
  logTextY: logPanel.y + PANEL_TEXT_PADDING_Y,
  logTextWidth: logPanel.width - LOG_TEXT_WIDTH_OFFSET,
  contractRowX: systemPanel.x + PANEL_TEXT_PADDING_X,
  contractRowStartY: systemPanel.y + CONTRACT_ROW_TOP_OFFSET,
  contractRowGap: CONTRACT_ROW_GAP,
  contractRowWidth: systemPanel.width - 32,
  contractRowHeight: CONTRACT_ROW_HEIGHT,
  contractButtonWidth: 84
} as const;
