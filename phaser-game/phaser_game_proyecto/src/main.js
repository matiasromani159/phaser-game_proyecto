import Phaser from 'phaser';
import Room1 from './rooms/Room1.js';
import Room2 from './rooms/Room2.js';
import Room3 from './rooms/Room3.js';
import Room4 from './rooms/Room4.js';
import Room5 from './rooms/Room5.js';
import Room6 from './rooms/Room6.js';
import Room7 from './rooms/Room7.js';
import Room8 from './rooms/Room8.js';
import Room9 from './rooms/Room9.js';
import Room10 from './rooms/Room10.js';
import Room11 from './rooms/Room11.js';
import Room12 from './rooms/Room12.js';
import Room13 from './rooms/Room13.js';
import Room14 from './rooms/Room14.js';
import Room15 from './rooms/Room15.js';
import Room16 from './rooms/Room16.js';
import Room17 from './rooms/Room17.js';
import Room18 from './rooms/Room18.js';
import GameOverScene from './scenes/GameOverScene.js';
import AuthScene from './scenes/AuthScene.js';
import LoginScene from './scenes/LoginScene.js';
import SaveScene from './scenes/SaveScene.js';
import BossScene from './scenes/BossScene.js';
import DebugRoomSelector from './scenes/DebugRoomSelector.js';
import MazmorraRoom1 from './rooms/MazmorraRoom1.js';
import MenuScene from './scenes/MenuScene.js';

const IS_DEBUG = true;

const config = {
    type: Phaser.AUTO,
    width: 432,
    height: 324,
    zoom: 2,
    scene: IS_DEBUG
        ? [DebugRoomSelector, MenuScene, AuthScene, LoginScene, MazmorraRoom1, Room1, Room2, Room3, Room4, Room5, Room6, Room7, Room8, Room9, Room10, Room11, Room12, Room13, Room14, Room15, Room16, Room17, Room18, BossScene, GameOverScene, SaveScene]
        : [AuthScene, MenuScene, LoginScene, MazmorraRoom1, Room1, Room2, Room3, Room4, Room5, Room6, Room7, Room8, Room9, Room10, Room11, Room12, Room13, Room14, Room15, Room16, Room17, Room18, BossScene, GameOverScene, SaveScene],
    physics: {
        default: 'arcade',
        arcade: { debug: true }
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