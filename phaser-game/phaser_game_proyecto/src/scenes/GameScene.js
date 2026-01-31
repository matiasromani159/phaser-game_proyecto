import Player from '../entities/player.js';
import Monster from '../entities/monster.js';
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
//prueba cambio waaa22222
//que kris haga boom

        this.load.audio('snd_board', '/src/assets/sounds/tenna_island.ogg');

        this.load.image('healthbar', '/src/assets/sprites/spr_hp_bar.png');

        //KRIS
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
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

        //GUARDAR PERO ES TEMPORAL 
this.keyG = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.G
);

        // ===== CONTADOR DE TIEMPO =====
        this.segundos = 0;

        this.textoTiempo = this.add.text(56, 56, 'Tiempo: 0', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        // Evento cada segundo
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.segundos++;
                this.textoTiempo.setText('Tiempo: ' + this.segundos);
            }
        });

        //musica loop
        this.music = this.sound.add('snd_board', {
            loop: true,
            volume: 0.5
        });

        this.music.play();

        // animaciones
        const makeAnim = (key, frames) => {
            this.anims.create({
                key,
                frames: frames.map(f => ({ key: f })),
                frameRate: 6,
                repeat: -1
            });

        };


        makeAnim('walk-down', ['down0', 'down1']);
        makeAnim('walk-up', ['up0', 'up1']);
        makeAnim('walk-left', ['left0', 'left1']);
        makeAnim('walk-right', ['right0', 'right1']);

        makeAnim('monster-walk', ['monster_right_0', 'monster_right_1']);
        // jugador
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.cursors = this.input.keyboard.createCursorKeys();

        // enemigo
        this.monster = new Monster(this, 100, 300, 'monster_right_0');
        this.monster.play('monster-walk');


        this.player.lastDamageTime = 0;

        this.hitSound = this.sound.add('player_hit'); // cargar sonido en preload

        this.physics.add.collider(this.player, this.monster, (player, monster) => {
            let ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10);
                player.lastDamageTime = ahora;

                // Reproducir sonido de daño
                player.scene.hitSound.play();

                // Activar parpadeo / invulnerabilidad
                player.startInvincibility(1000);


                // === Knockback ===
                const pushDistance = 32; // distancia base, similar a hitmovespeed
                const pushDuration = 150; // ms para que sea rápido pero visible

                // Calculamos vector desde el enemigo hacia el jugador
                let dx = player.x - monster.x;
                let dy = player.y - monster.y;
                let distancia = Math.sqrt(dx * dx + dy * dy);
                if (distancia === 0) distancia = 1; // evitar división por cero
                dx /= distancia;
                dy /= distancia;

                // Objetivo final del knockback
                let targetX = player.x + dx * pushDistance;
                let targetY = player.y + dy * pushDistance;

                // Usamos tween para mover suavemente y respetar colisiones
                this.tweens.add({
                    targets: player,
                    x: targetX,
                    y: targetY,
                    duration: pushDuration,
                    ease: 'Power1',
                    onUpdate: () => {
                        // Opcional: revisar colisiones con world bounds
                        player.body.blocked.up && (player.y = player.body.y);
                        player.body.blocked.down && (player.y = player.body.y);
                        player.body.blocked.left && (player.x = player.body.x);
                        player.body.blocked.right && (player.x = player.body.x);
                    }
                });

                console.log("Jugador recibió daño y knockback aplicado");
            }
        }, null, this);



    }

   update() {
    this.player.update(this.cursors);
    this.monster.actualizar();

    if (Phaser.Input.Keyboard.JustDown(this.keyG)) {
        this.guardarPartida();
    }

    
}
guardarPartida() {
    const saveData = {
        tiempo: this.segundos,
       // vida: this.player.hp,   // asumo que Player tiene hp
        // x: this.player.x,
        // y: this.player.y
    };

        fetch("http://localhost:3000/php/guardar.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(saveData)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Partida guardada:", data);
    })
    .catch(err => console.error(err));
}

}
