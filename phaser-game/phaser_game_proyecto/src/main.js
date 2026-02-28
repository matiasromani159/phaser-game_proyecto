import Phaser from 'phaser';
import Room1 from './rooms/Room1.js';
import Room2 from './rooms/Room2.js';
import GameOverScene from './scenes/GameOverScene.js';
import AuthScene from './scenes/AuthScene.js';
import LoginScene from './scenes/LoginScene.js';

//Una prueba para GIthuB
const config = {
    type: Phaser.AUTO,
    width: 432,
    height: 324,
    //    scene: [AuthScene, LoginScene, GameScene, GameOverScene],
    scene: [Room1, Room2, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    pixelArt: true,     // para pixel art
    roundPixels: true   // evita temblor de sprites
};


new Phaser.Game(config);
