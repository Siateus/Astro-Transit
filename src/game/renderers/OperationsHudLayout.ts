const TITLE_BAR_OFFSET_Y = 8;
const PANEL_TEXT_PADDING_X = 12;
const PANEL_TEXT_PADDING_Y = 32;
const PANEL_TEXT_WIDTH_OFFSET = 28;
const LOG_TEXT_WIDTH_OFFSET = 28;
const CONTRACT_ROW_HEIGHT = 30;
const CONTRACT_ROW_GAP = 34;
const CONTRACT_ROW_TOP_OFFSET = 78;

export const HUD_PANEL_BOUNDS = {
  overview: { x: 1124, y: 70, width: 264, height: 108 },
  system: { x: 1124, y: 184, width: 264, height: 236 },
  fleet: { x: 1124, y: 426, width: 264, height: 122 },
  shipyard: { x: 1124, y: 554, width: 264, height: 132 },
  log: { x: 42, y: 556, width: 382, height: 118 }
} as const;

export const HUD_CONTRACT_ROW_COUNT = 4;

const systemPanel = HUD_PANEL_BOUNDS.system;
const fleetPanel = HUD_PANEL_BOUNDS.fleet;
const shipyardPanel = HUD_PANEL_BOUNDS.shipyard;
const overviewPanel = HUD_PANEL_BOUNDS.overview;
const logPanel = HUD_PANEL_BOUNDS.log;

export const HUD_LAYOUT = {
  overviewTitle: {
    x: overviewPanel.x + 8,
    y: overviewPanel.y + TITLE_BAR_OFFSET_Y,
    width: overviewPanel.width - 16,
    height: 18,
    text: "Diretoria"
  },
  systemTitle: {
    x: systemPanel.x + 8,
    y: systemPanel.y + TITLE_BAR_OFFSET_Y,
    width: systemPanel.width - 16,
    height: 18,
    text: "Sistema"
  },
  fleetTitle: {
    x: fleetPanel.x + 8,
    y: fleetPanel.y + TITLE_BAR_OFFSET_Y,
    width: fleetPanel.width - 16,
    height: 18,
    text: "Frota"
  },
  logTitle: {
    x: logPanel.x + 8,
    y: logPanel.y + TITLE_BAR_OFFSET_Y,
    width: logPanel.width - 16,
    height: 18,
    text: "Registro"
  },
  shipyardTitle: {
    x: shipyardPanel.x + 8,
    y: shipyardPanel.y + TITLE_BAR_OFFSET_Y,
    width: shipyardPanel.width - 16,
    height: 18,
    text: "Estaleiro"
  },
  overviewText: {
    x: overviewPanel.x + PANEL_TEXT_PADDING_X,
    y: overviewPanel.y + PANEL_TEXT_PADDING_Y,
    width: overviewPanel.width - 40,
    size: 12
  },
  alertsText: {
    x: overviewPanel.x + PANEL_TEXT_PADDING_X,
    y: overviewPanel.y + overviewPanel.height - 18,
    width: overviewPanel.width - 40,
    size: 9
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
    y: fleetPanel.y + fleetPanel.height - 22,
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
  contractButtonWidth: 84,
  contractFilterButton: {
    x: systemPanel.x + systemPanel.width - 102,
    y: systemPanel.y + 34,
    width: 82,
    height: 20
  },
  shipyardRowX: shipyardPanel.x + PANEL_TEXT_PADDING_X,
  shipyardRowStartY: shipyardPanel.y + PANEL_TEXT_PADDING_Y,
  shipyardRowGap: 34,
  shipyardRowWidth: shipyardPanel.width - 24,
  shipyardRowHeight: 30,
  shipyardButtonWidth: 64
} as const;
