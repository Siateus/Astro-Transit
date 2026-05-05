export interface GameAssetManifestEntry {
  key: string;
  provisionalPath: string;
  futurePath: string | null;
  usage: string;
}

export const GameAssetKeys = {
  bootBackground: "background",
  menuBackdrop: "menu-backdrop",
  star: "star",
  timeRewind: "time-rewind",
  timePause: "time-pause",
  timePlay: "time-play",
  timeFastForward: "time-fast-forward",
  uiMainPanelWide: "ui-main-panel-wide",
  uiMainPanelTall: "ui-main-panel-tall",
  uiMainPanelCompact: "ui-main-panel-compact",
  uiTitlePanelWide: "ui-title-panel-wide",
  uiTitlePanelCompact: "ui-title-panel-compact",
  uiButtonPrimary: "ui-button-primary",
  uiButtonBar: "ui-button-bar",
  uiButtonBarActive: "ui-button-bar-active",
  uiGrid: "ui-grid",
  cargoBasicSupplies: "cargo-basic-supplies",
  cargoIllegal: "cargo-illegal",
  cargoFragile: "cargo-fragile",
  cargoPerishables: "cargo-perishables",
  shipCinderRelay: "ship-cinder-relay",
  shipMercurySpine: "ship-mercury-spine",
  shipAstraHauler: "ship-astra-hauler",
  statusLogs: "status-logs",
  statusEmergency: "status-emergency",
  statusCriticalDamage: "status-critical-damage",
  statusRepair: "status-repair",
  characterCaptain: "character-captain",
  characterCeo: "character-ceo"
} as const;

export const BOOT_ASSET_MANIFEST: readonly GameAssetManifestEntry[] = [
  {
    key: GameAssetKeys.bootBackground,
    provisionalPath: "assets/background.png",
    futurePath: "assets/final/loading-background.png",
    usage: "Fundo usado apenas na cena de carregamento."
  }
] as const;

export const GAME_ASSET_MANIFEST: readonly GameAssetManifestEntry[] = [
  {
    key: GameAssetKeys.menuBackdrop,
    provisionalPath: "galaxy_bg.png",
    futurePath: "final/menu-backdrop.png",
    usage: "Imagem base do menu principal."
  },
  {
    key: GameAssetKeys.star,
    provisionalPath: "star.png",
    futurePath: "final/star-particle.png",
    usage: "Particulas discretas do menu e referencia visual de estrela."
  },
  {
    key: GameAssetKeys.timeRewind,
    provisionalPath: "fast backward.png",
    futurePath: "final/icons/time-rewind.png",
    usage: "Icone reservado para controles de tempo."
  },
  {
    key: GameAssetKeys.timePause,
    provisionalPath: "pause.png",
    futurePath: "final/icons/time-pause.png",
    usage: "Botao de pausa da top bar."
  },
  {
    key: GameAssetKeys.timePlay,
    provisionalPath: "play.png",
    futurePath: "final/icons/time-play.png",
    usage: "Botao de velocidade normal da top bar."
  },
  {
    key: GameAssetKeys.timeFastForward,
    provisionalPath: "fast forward.png",
    futurePath: "final/icons/time-fast-forward.png",
    usage: "Botoes 2x e 4x da top bar."
  },
  {
    key: GameAssetKeys.uiMainPanelWide,
    provisionalPath: "UI/MainPanel01.png",
    futurePath: "final/ui/main-panel-wide.png",
    usage: "Painel largo para HUD e telas de menu."
  },
  {
    key: GameAssetKeys.uiMainPanelTall,
    provisionalPath: "UI/MainPanel02.png",
    futurePath: "final/ui/main-panel-tall.png",
    usage: "Painel alto do sistema em foco."
  },
  {
    key: GameAssetKeys.uiMainPanelCompact,
    provisionalPath: "UI/MainPanel03.png",
    futurePath: "final/ui/main-panel-compact.png",
    usage: "Painel compacto e trilho da top bar."
  },
  {
    key: GameAssetKeys.uiTitlePanelWide,
    provisionalPath: "UI/TitlePanel01.png",
    futurePath: "final/ui/title-panel-wide.png",
    usage: "Titulo largo dos paineis."
  },
  {
    key: GameAssetKeys.uiTitlePanelCompact,
    provisionalPath: "UI/TitlePanel02.png",
    futurePath: "final/ui/title-panel-compact.png",
    usage: "Titulo compacto dos paineis."
  },
  {
    key: GameAssetKeys.uiButtonPrimary,
    provisionalPath: "UI/Button01.png",
    futurePath: "final/ui/button-primary.png",
    usage: "Botoes de acao do menu, contratos, frota e estaleiro."
  },
  {
    key: GameAssetKeys.uiButtonBar,
    provisionalPath: "UI/Button15.png",
    futurePath: "final/ui/button-bar.png",
    usage: "Botoes pequenos e placas de metrica inativas."
  },
  {
    key: GameAssetKeys.uiButtonBarActive,
    provisionalPath: "UI/Button16.png",
    futurePath: "final/ui/button-bar-active.png",
    usage: "Botoes pequenos e placas de metrica ativas."
  },
  {
    key: GameAssetKeys.uiGrid,
    provisionalPath: "UI/Grid.png",
    futurePath: "final/ui/panel-grid.png",
    usage: "Textura sutil de grade dentro dos paineis operacionais."
  },
  {
    key: GameAssetKeys.cargoBasicSupplies,
    provisionalPath: "cargas/suplementos-basico.png",
    futurePath: "final/cargo/basic-supplies.png",
    usage: "Icone de contratos de suprimentos basicos."
  },
  {
    key: GameAssetKeys.cargoIllegal,
    provisionalPath: "cargas/contrabando.png",
    futurePath: "final/cargo/illegal.png",
    usage: "Icone de contratos ilegais ou contrabando."
  },
  {
    key: GameAssetKeys.cargoFragile,
    provisionalPath: "cargas/fragil.png",
    futurePath: "final/cargo/fragile.png",
    usage: "Icone de contratos frageis."
  },
  {
    key: GameAssetKeys.cargoPerishables,
    provisionalPath: "cargas/perecivel.png",
    futurePath: "final/cargo/perishables.png",
    usage: "Icone de contratos pereciveis."
  },
  {
    key: GameAssetKeys.shipCinderRelay,
    provisionalPath: "ships/cinder.png",
    futurePath: "final/ships/cinder-relay.png",
    usage: "Miniatura da nave Cinder Relay."
  },
  {
    key: GameAssetKeys.shipMercurySpine,
    provisionalPath: "ships/mercury.png",
    futurePath: "final/ships/mercury-spine.png",
    usage: "Miniatura da nave Mercury Spine."
  },
  {
    key: GameAssetKeys.shipAstraHauler,
    provisionalPath: "ships/astra.png",
    futurePath: "final/ships/astra-hauler.png",
    usage: "Miniatura da nave Astra Hauler."
  },
  {
    key: GameAssetKeys.statusLogs,
    provisionalPath: "status-manutencao/logs.png",
    futurePath: "final/status/logs.png",
    usage: "Icone do painel de registro e auditoria."
  },
  {
    key: GameAssetKeys.statusEmergency,
    provisionalPath: "status-manutencao/emergency.png",
    futurePath: "final/status/emergency.png",
    usage: "Icone de emergencia, SOS e alertas criticos."
  },
  {
    key: GameAssetKeys.statusCriticalDamage,
    provisionalPath: "status-manutencao/critical-damage.png",
    futurePath: "final/status/critical-damage.png",
    usage: "Icone de nave danificada."
  },
  {
    key: GameAssetKeys.statusRepair,
    provisionalPath: "status-manutencao/repair.png",
    futurePath: "final/status/repair.png",
    usage: "Icone de manutencao e reparo."
  },
  {
    key: GameAssetKeys.characterCaptain,
    provisionalPath: "characters/Space_Captain.png",
    futurePath: "final/characters/captain.png",
    usage: "Retrato operacional para comunicados e menu."
  },
  {
    key: GameAssetKeys.characterCeo,
    provisionalPath: "characters/ceo.png",
    futurePath: "final/characters/ceo.png",
    usage: "Retrato executivo para menu principal e diretoria."
  }
] as const;

export function getCargoIconKey(cargoType: string) {
  if (cargoType === "illegal") {
    return GameAssetKeys.cargoIllegal;
  }

  if (cargoType === "fragile") {
    return GameAssetKeys.cargoFragile;
  }

  if (cargoType === "perishables") {
    return GameAssetKeys.cargoPerishables;
  }

  return GameAssetKeys.cargoBasicSupplies;
}

export function getShipIconKey(typeId?: string, shipName = "") {
  const normalized = `${typeId ?? ""} ${shipName}`.toLowerCase();
  if (normalized.includes("mercury")) {
    return GameAssetKeys.shipMercurySpine;
  }

  if (normalized.includes("cinder")) {
    return GameAssetKeys.shipCinderRelay;
  }

  return GameAssetKeys.shipAstraHauler;
}

export function getShipStatusIconKey(status: string, integrity = 100) {
  if (status === "stranded") {
    return GameAssetKeys.statusEmergency;
  }

  if (status === "maintenance") {
    return GameAssetKeys.statusRepair;
  }

  if (status === "damaged" || integrity < 45) {
    return GameAssetKeys.statusCriticalDamage;
  }

  return GameAssetKeys.statusLogs;
}
