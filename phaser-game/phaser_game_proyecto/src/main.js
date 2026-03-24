import Phaser from 'phaser';
import Room1 from './rooms/Room1.js';
import Room2 from './rooms/Room2.js';
import GameOverScene from './scenes/GameOverScene.js';
import AuthScene from './scenes/AuthScene.js';
import LoginScene from './scenes/LoginScene.js';
import SaveScene from './scenes/SaveScene.js';
import BossScene from './scenes/BossScene.js';
import DebugRoomSelector from './scenes/DebugRoomSelector.js';
import MazmorraRoom1 from './rooms/MazmorraRoom1.js';
import MenuScene from './scenes/MenuScene.js';

const IS_DEBUG = false; // ← false para producción

const config = {
    type: Phaser.AUTO,
    width: 432,
    height: 324,
    zoom: 2,
    scene: IS_DEBUG
        ? [DebugRoomSelector, MenuScene, AuthScene, LoginScene, MazmorraRoom1, Room1, Room2, BossScene, GameOverScene, SaveScene]
        : [AuthScene,         MenuScene, LoginScene, MazmorraRoom1, Room1, Room2, BossScene, GameOverScene, SaveScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    pixelArt: true,
    roundPixels: true
};

async function init() {
    try {
        await Promise.all([
            document.fonts.load('16px UndertaleFont'),
            document.fonts.load('16px "TennaGlyphs"'),
        ]);
    } catch (e) {
        console.warn('[fonts] Error cargando fuentes, arrancando igualmente.', e);
    }

    const primer = document.createElement('div');
    primer.style.cssText = 'position:absolute;left:-9999px;opacity:0;font-size:16px;';
    primer.innerHTML =
        '<span style="font-family:UndertaleFont">.</span>' +
        '<span style="font-family:TennaGlyphs">.</span>';
    document.body.appendChild(primer);
    await new Promise(r => requestAnimationFrame(r));
    document.body.removeChild(primer);

    window.game = new Phaser.Game(config);
}

init();