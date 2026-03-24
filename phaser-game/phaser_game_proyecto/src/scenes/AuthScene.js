import GameState from '../GameState.js';

export default class AuthScene extends Phaser.Scene {
    constructor() {
        super('AuthScene');
    }

    create() {
        // Muestra un texto de carga mientras verifica sesión
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            'Cargando...', {
                fontFamily: 'UndertaleFont, monospace',
                fontSize  : '16px',
                color     : '#ffffff'
            }
        ).setOrigin(0.5).setResolution(10);

        fetch('/php/login.php')
            .then(res => res.json())
            .then(data => {
                if (data.logged) {
                    // Vuelca los datos del servidor en GameState
                    GameState.playerName   = data.username      ?? 'KRIS';
                    GameState.playerHP     = data.playerHP      ?? 100;
                    GameState.segundos     = data.tiempo        ?? 0;
                    GameState.roomActual   = data.scene         ?? 'Room1';
                    GameState.playerSpawn  = { x: data.x ?? 200, y: data.y ?? 200 };
                    GameState.monstersDead = JSON.parse(data.monstersDead ?? '[]');
                    GameState.userId       = data.userId;

                    // También guarda userId en registry para que SaveScene lo use
                    this.registry.set('userId',   data.userId);
                    this.registry.set('username', data.username);

                    this.scene.start('MenuScene', { hasSave: data.hasSave });
                } else {
                    this.scene.start('LoginScene');
                }
            })
            .catch(() => {
                // Sin servidor: arranca igualmente en modo local
                this.scene.start('MenuScene', { hasSave: GameState.haySave() });
            });
    }
}