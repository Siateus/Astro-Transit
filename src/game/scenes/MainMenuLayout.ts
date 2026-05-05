export interface MainMenuLayout {
  titleX: number;
  titleY: number;
  subtitleX: number;
  subtitleY: number;
  menuX: number;
  menuStartY: number;
  menuGap: number;
  menuButtonWidth: number;
  menuButtonHeight: number;
  hitAreaX: number;
  hitAreaYOffset: number;
  hitAreaWidth: number;
  hitAreaHeight: number;
  footerX: number;
  footerY: number;
}

export function buildMainMenuLayout(width: number, height: number): MainMenuLayout {
  const leftColumnWidth = width * 0.34;
  const menuX = Math.round(Math.max(40, leftColumnWidth * 0.12));

  return {
    titleX: menuX,
    titleY: Math.round(height * 0.04),
    subtitleX: menuX + 4,
    subtitleY: Math.round(height * 0.145),
    menuX,
    menuStartY: Math.round(height * 0.31),
    menuGap: Math.round(Math.max(52, height * 0.073)),
    menuButtonWidth: Math.round(Math.max(260, leftColumnWidth * 0.62)),
    menuButtonHeight: 42,
    hitAreaX: menuX,
    hitAreaYOffset: -21,
    hitAreaWidth: Math.round(Math.max(260, leftColumnWidth * 0.62)),
    hitAreaHeight: 42,
    footerX: menuX + 4,
    footerY: height - 64
  };
}
