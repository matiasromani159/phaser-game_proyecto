import Player from '../entities/player.js';
import Monster from '../entities/monster.js';
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
       
        //KRIS
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

        //MONSTRUO BASICO 
        this.load.image('monster_right_0', '/src/assets/sprites/spr_monster/spr_monster_0.png')
        this.load.image('monster_right_1', '/src/assets/sprites/spr_monster/spr_monster_1.png')

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

         makeAnim('monster-walk', ['monster_right_0', 'monster_right_1']);
        // jugador
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.cursors = this.input.keyboard.createCursorKeys();

        // enemigo
          this.monster = new Monster(this, 100, 300, 'monster_right_0');
          this.monster.play('monster-walk');
    }

    update() {
        this.player.update(this.cursors);
           this.monster.actualizar();
    }
}
