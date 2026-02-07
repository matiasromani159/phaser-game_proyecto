import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

//Una prueba para GIthuB
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    pixelArt: true,     // para pixel art
    roundPixels: true   // evita temblor de sprites
};


new Phaser.Game(config);
