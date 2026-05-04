export interface MainMenuLayout {
  titleX: number;
  titleY: number;
  subtitleX: number;
  subtitleY: number;
  menuX: number;
  menuStartY: number;
  menuGap: number;
  underlineOffsetY: number;
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
    underlineOffsetY: 34,
    hitAreaX: menuX - 12,
    hitAreaYOffset: -8,
    hitAreaWidth: Math.round(Math.max(240, leftColumnWidth * 0.58)),
    hitAreaHeight: 40,
    footerX: menuX + 4,
    footerY: height - 64
  };
}
