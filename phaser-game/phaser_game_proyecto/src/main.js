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
import Room19 from './rooms/Room19.js';
import GameOverScene from './scenes/GameOverScene.js';
import AuthScene from './scenes/AuthScene.js';
import LoginScene from './scenes/LoginScene.js';
import SaveScene from './scenes/SaveScene.js';
import BossScene from './scenes/BossScene.js';
import DebugRoomSelector from './scenes/DebugRoomSelector.js';
import MazmorraRoom1 from './rooms/MazmorraRoom1.js';
import MazmorraRoom2 from './rooms/MazmorraRoom2.js';
import MazmorraRoom3 from './rooms/MazmorraRoom3.js';
import MazmorraRoom4 from './rooms/MazmorraRoom4.js';
import MazmorraRoom5 from './rooms/MazmorraRoom5.js';
import MazmorraRoom6 from './rooms/MazmorraRoom6.js';
import MazmorraRoom7 from './rooms/MazmorraRoom7.js';
import MazmorraRoom8 from './rooms/MazmorraRoom8.js';
import MazmorraRoom9 from './rooms/MazmorraRoom9.js';
import MazmorraRoom10 from './rooms/MazmorraRoom10.js';
import MazmorraRoom11 from './rooms/MazmorraRoom11.js';
import MazmorraRoom12 from './rooms/MazmorraRoom12.js';
import MazmorraRoom13 from './rooms/MazmorraRoom13.js';
import AICompanionScene from './scenes/AICompanionScene.js';
import GeminiService from './services/GeminiService.js';
import MenuScene from './scenes/MenuScene.js';
import ProfileScene from './scenes/ProfileScene.js'; 
import ControlsScene from './scenes/ControlsScene.js';

const GEMINI_API_KEY = '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';

const IS_DEBUG = false;

const config = {
    type: Phaser.AUTO,
    width: 432,
    height: 324,
    
    // ⬇️ CAMBIOS CLAVE AQUÍ ⬇️
    // Eliminado: zoom: 2 (lo manejamos con scale.mode para mejor control)
    
    scale: {
        mode: Phaser.Scale.FIT,              // Escala para caber en pantalla
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centrado horizontal y vertical
        parent: 'game-container',             // ID del div contenedor (ajústalo)
        width: 432,
        height: 324,
    },
    
    scene: IS_DEBUG
        ? [DebugRoomSelector, ControlsScene, MenuScene, AuthScene, LoginScene, ProfileScene, AICompanionScene, MazmorraRoom1, MazmorraRoom2, MazmorraRoom3, MazmorraRoom4, MazmorraRoom5, MazmorraRoom6, MazmorraRoom7, MazmorraRoom8, MazmorraRoom9, MazmorraRoom10, MazmorraRoom11, MazmorraRoom12, MazmorraRoom13, Room1, Room2, Room3, Room4, Room5, Room6, Room7, Room8, Room9, Room10, Room11, Room12, Room13, Room14, Room15, Room16, Room17, Room18, Room19, BossScene, GameOverScene, SaveScene]
        : [AuthScene, ControlsScene, MenuScene, LoginScene, AICompanionScene, ProfileScene, MazmorraRoom1, MazmorraRoom2, MazmorraRoom3, MazmorraRoom4, MazmorraRoom5, MazmorraRoom6, MazmorraRoom7, MazmorraRoom8, MazmorraRoom9, MazmorraRoom10, MazmorraRoom11, MazmorraRoom12, MazmorraRoom13, Room1, Room2, Room3, Room4, Room5, Room6, Room7, Room8, Room9, Room10, Room11, Room12, Room13, Room14, Room15, Room16, Room17, Room18, Room19, BossScene, GameOverScene, SaveScene],
    
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    
    pixelArt: true,      // ← Ya lo tienes, perfecto
    roundPixels: true,   // ← Ya lo tienes, perfecto
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
    
    // Crear servicio Gemini global
    window.game.geminiService = new GeminiService(GEMINI_API_KEY);
    console.log('[Gemini] Servicio inicializado correctamente');
}

init();