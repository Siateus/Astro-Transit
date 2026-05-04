export interface PreloaderLayout {
  centerX: number;
  centerY: number;
  barWidth: number;
  barHeight: number;
  barInnerWidth: number;
  barStartX: number;
  titleY: number;
  percentY: number;
  backgroundDisplayWidth: number;
  backgroundDisplayHeight: number;
}

export function buildPreloaderLayout(width: number, height: number): PreloaderLayout {
  const barWidth = Math.round(Math.min(468, width * 0.46));
  const barHeight = 32;
  const barInnerWidth = barWidth - 8;
  const centerX = Math.round(width / 2);
  const centerY = Math.round(height / 2);

  return {
    centerX,
    centerY,
    barWidth,
    barHeight,
    barInnerWidth,
    barStartX: centerX - Math.round(barWidth / 2) + 4,
    titleY: centerY - 38,
    percentY: centerY + 34,
    backgroundDisplayWidth: width,
    backgroundDisplayHeight: height
  };
}
