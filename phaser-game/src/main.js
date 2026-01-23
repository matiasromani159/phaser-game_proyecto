import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    pixelArt: true,     // 👈 importante para pixel art
    roundPixels: true   // 👈 opcional, evita temblor de sprites
};


new Phaser.Game(config);
