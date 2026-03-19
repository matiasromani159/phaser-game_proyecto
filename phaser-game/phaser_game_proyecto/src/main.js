import Phaser from 'phaser';
import Room1 from './rooms/Room1.js';
import Room2 from './rooms/Room2.js';
import GameOverScene from './scenes/GameOverScene.js';
import AuthScene from './scenes/AuthScene.js';
import LoginScene from './scenes/LoginScene.js';
import SaveScene from './scenes/SaveScene.js';
import BossScene from './scenes/BossScene.js';

//Una prueba para GIthuB
const config = {
    type: Phaser.AUTO,
    
    width: 432,
    height: 324,
     zoom: 2, 
    //    scene: [AuthScene, LoginScene, GameScene, GameOverScene],
    scene: [Room1, Room2, BossScene, GameOverScene, SaveScene],
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    pixelArt: true,     // para pixel art
    roundPixels: true   // evita temblor de sprites
};


// al final del archivo, reemplaza la última línea
window.game = new Phaser.Game(config);
// main.js — añade esta línea

