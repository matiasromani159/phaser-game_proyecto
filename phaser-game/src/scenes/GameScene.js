import Player from '../entities/player.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // ↓ asegúrate de que estas rutas coincidan con tus archivos
        // DOWN
        this.load.image('down0', '/src/assets/sprites/spr_kris_down/spr_kris_0.png');
        this.load.image('down1', '/src/assets/sprites/spr_kris_down/spr_kris_1.png');
        // UP
        this.load.image('up0', '/src/assets/sprites/spr_kris_up/spr_kris_0.png');
        this.load.image('up1', '/src/assets/sprites/spr_kris_up/spr_kris_1.png');
        // LEFT
        this.load.image('left0', '/src/assets/sprites/spr_kris_left/spr_kris_0.png');
        this.load.image('left1', '/src/assets/sprites/spr_kris_left/spr_kris_1.png');
        // RIGHT
        this.load.image('right0', '/src/assets/sprites/spr_kris_right/spr_kris_0.png');
        this.load.image('right1', '/src/assets/sprites/spr_kris_right/spr_kris_1.png');
    }

    create() {
        // animaciones
        const makeAnim = (key, frames) => {
            this.anims.create({
                key,
                frames: frames.map(f => ({ key: f })),
                frameRate: 6,
                repeat: -1
            });
        };

        makeAnim('walk-down', ['down0','down1']);
        makeAnim('walk-up', ['up0','up1']);
        makeAnim('walk-left', ['left0','left1']);
        makeAnim('walk-right', ['right0','right1']);

        // jugador
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        this.player.update(this.cursors);
    }
}
