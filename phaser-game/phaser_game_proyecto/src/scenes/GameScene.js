import Player from '../entities/player.js';
import Monster from '../entities/monster.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        //La habeis liado 
        // Sonidos
        this.load.audio('snd_board', '/src/assets/sounds/tenna_island.ogg');
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword', '/src/assets/sounds/snd_sword.wav');

        // Barra de vida
        this.load.image('healthbar', '/src/assets/sprites/spr_hp_bar.png');

        // KRIS caminar
        this.load.image('down0', '/src/assets/sprites/spr_kris_down/spr_kris_0.png');
        this.load.image('down1', '/src/assets/sprites/spr_kris_down/spr_kris_1.png');
        this.load.image('up0', '/src/assets/sprites/spr_kris_up/spr_kris_0.png');
        this.load.image('up1', '/src/assets/sprites/spr_kris_up/spr_kris_1.png');
        this.load.image('left0', '/src/assets/sprites/spr_kris_left/spr_kris_0.png');
        this.load.image('left1', '/src/assets/sprites/spr_kris_left/spr_kris_1.png');
        this.load.image('right0', '/src/assets/sprites/spr_kris_right/spr_kris_0.png');
        this.load.image('right1', '/src/assets/sprites/spr_kris_right/spr_kris_1.png');

        // KRIS atacar
        ['down', 'up', 'left', 'right'].forEach(dir => {
            for (let i = 0; i < 3; i++) {
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
            }
        });

        // Monstruo
        this.load.image('monster_right_0', '/src/assets/sprites/spr_monster/spr_monster_0.png');
        this.load.image('monster_right_1', '/src/assets/sprites/spr_monster/spr_monster_1.png');

        // Muerte del monstruo
        for (let i = 0; i < 3; i++) {
            this.load.image(`monster_defeat_${i}`, `/src/assets/sprites/spr_monster_defeat/spr_defeat_${i}.png`);
        }

    }

    create(data) {

        this.gameIsOver = false;

        // Teclas
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.cursors = this.input.keyboard.createCursorKeys();

        // Contador de tiempo
        this.segundos = 0;
        this.textoTiempo = this.add.text(56, 56, 'Tiempo: 0', { fontSize: '18px', fill: '#ffffff' }).setScrollFactor(0);
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.segundos++;
                this.textoTiempo.setText('Tiempo: ' + this.segundos);
            }
        });


        // Música
        this.music = this.sound.add('snd_board', { loop: true, volume: 0.5 });
        this.music.play();
        this.attackSound = this.sound.add('snd_sword', { volume: 0.5 });

        // Animaciones
        const makeAnim = (key, frames, fps = 6, repeat = -1) => {
            this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fps, repeat });
        };

        // Animaciones caminar
        makeAnim('walk-down', ['down0', 'down1']);
        makeAnim('walk-up', ['up0', 'up1']);
        makeAnim('walk-left', ['left0', 'left1']);
        makeAnim('walk-right', ['right0', 'right1']);
        makeAnim('monster-walk', ['monster_right_0', 'monster_right_1']);

        // Animaciones atacar
        makeAnim('attack-down', ['downAttack0', 'downAttack1', 'downAttack2'], 10, 0);
        makeAnim('attack-up', ['upAttack0', 'upAttack1', 'upAttack2'], 10, 0);
        makeAnim('attack-left', ['leftAttack0', 'leftAttack1', 'leftAttack2'], 10, 0);
        makeAnim('attack-right', ['rightAttack0', 'rightAttack1', 'rightAttack2'], 10, 0);

        makeAnim('monster-die', [
            'monster_defeat_0',
            'monster_defeat_1',
            'monster_defeat_2'
        ], 12, 0); // repeat = 0 → se reproduce una sola vez



        // Crear jugador
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.player.lastDamageTime = 0;

        // Crear grupo de monstruos
        this.monsters = this.physics.add.group();
        const monster = new Monster(this, 100, 300, 'monster_right_0');
        monster.play('monster-walk');
        this.monsters.add(monster);

        // Sonido de daño
        this.hitSound = this.sound.add('player_hit');

        // Colisiones jugador-monstruo (daño)
        this.physics.add.collider(this.player, this.monsters, (player, monster) => {
            let ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10);
                player.lastDamageTime = ahora;
                this.hitSound.play();

                // Knockback
                const pushDistance = 32;
                const pushDuration = 150;
                let dx = player.x - monster.x;
                let dy = player.y - monster.y;
                let distancia = Math.sqrt(dx * dx + dy * dy) || 1;
                dx /= distancia; dy /= distancia;
                this.tweens.add({
                    targets: player,
                    x: player.x + dx * pushDistance,
                    y: player.y + dy * pushDistance,
                    duration: pushDuration,
                    ease: 'Power1'
                });
            }
        });

        // Colisión hitbox del jugador con monstruos (muerte de un golpe)
        this.physics.add.overlap(this.player.attackHitbox, this.monsters, (hitbox, monster) => {
            monster.die();
        });
        if (data?.fromGameOver) {
            // Hacer un fade in
            this.cameras.main.setAlpha(0); // empieza invisible
            this.tweens.add({
                targets: this.cameras.main,
                alpha: 1,
                duration: 1000, // duración del fade in en ms
                ease: 'Linear'
            });
        } else {
            this.cameras.main.setAlpha(1); // inicio normal
        }
    }

    playerDied() {
        if (this.gameIsOver) return;

        this.gameIsOver = true;

        if (this.music) this.music.stop();
        if (this.timerEvent) this.timerEvent.remove();

        this.time.delayedCall(0, () => {

            this.scene.start('GameOverScene', {
                x: this.player.x,
                y: this.player.y
            });
        });
    }




    update() {

        if (this.gameIsOver) return;

        // Actualizar jugador y monstruos
        this.player.update(this.cursors);
        this.monsters.getChildren().forEach(monster => monster.actualizar());

        // Guardar
        if (Phaser.Input.Keyboard.JustDown(this.keyG)) this.guardarPartida();

        // Ataque
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) this.player.attack();
    }

    guardarPartida() {
        const saveData = { tiempo: this.segundos };
        fetch("/php/guardar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saveData)
        }).then(res => res.json())
            .then(data => console.log("Partida guardada:", data))
            .catch(err => console.error(err));
    }
}
