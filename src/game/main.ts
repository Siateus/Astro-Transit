import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/EndGame';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { GameConfig } from './utils/GameConfig';
import { UIScene } from './scenes/UIScene';
import { UIStyle } from './ui/UIStyle';
//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GameConfig.WIDTH,
    height: GameConfig.HEIGHT,
    parent: 'game-container',
    backgroundColor: UIStyle.PALETTE.BACKGROUND_DEEP_SPACE,
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        UIScene
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
