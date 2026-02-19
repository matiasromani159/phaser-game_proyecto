import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene.js';
import AuthScene from './scenes/AuthScene.js';
import LoginScene from './scenes/LoginScene.js';

//Una prueba para GIthuB
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
//    scene: [AuthScene, LoginScene, GameScene, GameOverScene],
scene: [GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    pixelArt: true,     // para pixel art
    roundPixels: true   // evita temblor de sprites
};


new Phaser.Game(config);
