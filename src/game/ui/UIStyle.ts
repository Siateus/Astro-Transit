// src/game/ui/UIStyle.ts

export const UIStyle = {
    PALETTE: {
        PRIMARY_BLUE: { bg: 0x0099ff, text: '#ffffff', hover: 0x00ccff },
        PRIMARY_ORANGE: { bg: 0xff6600, text: '#ffffff', hover: 0xffaa00 },
        BACKGROUND_DARK: 0x111122,
        BACKGROUND_DEEP_SPACE: 0x020202, // Preto absoluto Stellaris
        STAR_NEUTRAL: 0xf2f2f2,
        STAR_PLAYER: 0x00ff00,
        STAR_TARGET: 0x0088ff,
        CONNECTION_LINE: 0x556677, // Cinza sutil para rotas
        MARKET_ACCENT: 0xaa00aa,
        EVENT_ALERT_BG: 0xff6600,
        EVENT_MODAL: { bg: 0x330000, border: 0xff0000 },
        STATUS_OK: { bg: 0x00cc00, hover: 0x00ff00 },
        STATUS_INFO: { bg: 0x0099ff, hover: 0x00ccff },
        PANEL_TRIM: 0x39c0f9,
        ERROR: { bg: 0xcc0000, text: '#ffffff', hover: 0xff3333 },
        WARNING: { bg: 0xaa00aa, text: '#ffffff', hover: 0xff00ff },
        SUCCESS: { bg: 0x00aa00, text: '#ffffff', hover: 0x00ff00 },
        MODAL_BG: 0x550000,
        MODAL_HOVER: 0xaa0000
    },

    TYPOGRAPHY: {
        FONTS: {
            TITLE: 'Arial Black, sans-serif',
            BODY: 'Courier New, monospace',
            DEFAULT: 'Arial, sans-serif'
        },
        PRESET: {
            TITLE_MAIN: {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 64,
                color: '#00ffff',
                stroke: '#000000',
                strokeThickness: 4
            },
            TITLE_GAMEOVER: {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 64,
                color: '#ff0000'
            },
            SUBTITLE_GAMEOVER: {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 24,
                color: '#ffaa00'
            },
            STATUS_BAR: {
                fontFamily: 'Courier New, monospace',
                fontSize: 14,
                color: '#ffffff',
                fontStyle: 'bold'
            },
            HIGHLIGHT: {
                fontFamily: 'Courier New, monospace',
                fontSize: 16,
                color: '#ffaa00',
                fontStyle: 'bold'
            },
            BUTTON_TEXT: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                color: '#ffffff',
                fontStyle: 'bold'
            },
            PANEL_TITLE: {
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 16,
                color: '#39c0f9',
                fontStyle: 'bold'
            },
            BODY_TEXT: {
                fontFamily: 'Courier New, monospace',
                fontSize: 12,
                color: '#ffffff',
                lineSpacing: 6
            }
        }
    },

    ANIMATION: {
        DURATION_FAST: 150,
        DURATION_NORMAL: 300,
        EASE: 'Back.easeOut'
    }
};
