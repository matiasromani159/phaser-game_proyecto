import Player from '../entities/player.js';
import Monster from '../entities/monster.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // --- TILEMAP ---
        this.load.image("tiles", "/src/assets/tiles/tipe.png");
        this.load.tilemapTiledJSON("map", "/src/assets/tiles/Suelomapa.json");

        // --- SONIDOS ---
        this.load.audio('snd_board', '/src/assets/sounds/tenna_island.ogg');
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword', '/src/assets/sounds/snd_sword.wav');

        // --- BARRA DE VIDA ---
        this.load.image('healthbar', '/src/assets/sprites/spr_hp_bar.png');

        // --- KRIS CAMINAR Y ATAQUE ---
        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`${dir}${i}`, `/src/assets/sprites/spr_kris_${dir}/spr_kris_${i}.png`);
            for (let i = 0; i < 3; i++)
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
        });

        // --- MONSTRUO ---
        this.load.image('monster_right_0', '/src/assets/sprites/spr_monster/spr_monster_0.png');
        this.load.image('monster_right_1', '/src/assets/sprites/spr_monster/spr_monster_1.png');

        // --- MUERTE MONSTRUO ---
        for (let i = 0; i < 3; i++)
            this.load.image(`monster_defeat_${i}`, `/src/assets/sprites/spr_monster_defeat/spr_defeat_${i}.png`);
    }

    create(data) {
        // --- MAPA ---
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("tipe", "tiles");
        this.groundLayer = map.createLayer("ground", tileset, 0, 0);

        // --- ANIMACIONES AUTOMÁTICAS DE TILES ---
        this.animatedTiles = [];

        const mapJSON = this.cache.tilemap.get("map").data; // JSON completo
        const tilesetsJSON = mapJSON.tilesets;
        const tilesetJSON = tilesetsJSON[0]; // solo un tileset

        if (tilesetJSON.tiles) {
            tilesetJSON.tiles.forEach(tile => {
                if (tile.animation) {
                    const frames = tile.animation.map(f => f.tileid + tilesetJSON.firstgid);
                    const duration = tile.animation[0].duration;
                    const tileId = tile.id + tilesetJSON.firstgid;
                    this.animatedTiles.push({ tileId, frames, index: 0, timer: 0, duration, positions: [] });
                }
            });
        }

        // Guardar posiciones de cada tile animado en la capa
        this.animatedTiles.forEach(anim => {
            this.groundLayer.forEachTile(tile => {
                if (tile.index === anim.tileId) {
                    anim.positions.push({ x: tile.x, y: tile.y });
                }
            });
        });

        // --- VARIABLES ---
        this.gameIsOver = false;
        this.segundos = 0;

        // Teclas
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.cursors = this.input.keyboard.createCursorKeys();

        // Texto de tiempo
        this.textoTiempo = this.add.text(56, 56, 'Tiempo: 0', { fontSize: '18px', fill: '#ffffff' }).setScrollFactor(0);
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.segundos++;
                this.textoTiempo.setText('Tiempo: ' + this.segundos);
            }
        });

        // Música y sonidos
        this.music = this.sound.add('snd_board', { loop: true, volume: 0.5 });
        this.music.play();
        this.attackSound = this.sound.add('snd_sword', { volume: 0.5 });
        this.hitSound = this.sound.add('player_hit');

        // --- ANIMACIONES DE SPRITES ---
        const makeAnim = (key, frames, fps = 6, repeat = -1) => {
            this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fps, repeat });
        };

        makeAnim('walk-down', ['down0', 'down1']);
        makeAnim('walk-up', ['up0', 'up1']);
        makeAnim('walk-left', ['left0', 'left1']);
        makeAnim('walk-right', ['right0', 'right1']);
        makeAnim('monster-walk', ['monster_right_0', 'monster_right_1']);

        ['down', 'up', 'left', 'right'].forEach(dir =>
            makeAnim(`attack-${dir}`, [`${dir}Attack0`, `${dir}Attack1`, `${dir}Attack2`], 10, 0)
        );

        makeAnim('monster-die', ['monster_defeat_0','monster_defeat_1','monster_defeat_2'], 12, 0);

        // --- JUGADOR Y MONSTRUOS ---
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.player.lastDamageTime = 0;

        this.monsters = this.physics.add.group();
        const monster = new Monster(this, 100, 300, 'monster_right_0');
        monster.play('monster-walk');
        this.monsters.add(monster);

        // --- COLISIONES ---
        this.physics.add.collider(this.player, this.monsters, (player, monster) => {
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10);
                player.lastDamageTime = ahora;
                this.hitSound.play();

                const pushDistance = 32;
                const pushDuration = 150;
                let dx = player.x - monster.x;
                let dy = player.y - monster.y;
                let distancia = Math.sqrt(dx*dx + dy*dy) || 1;
                dx /= distancia; dy /= distancia;

                this.tweens.add({
                    targets: player,
                    x: player.x + dx*pushDistance,
                    y: player.y + dy*pushDistance,
                    duration: pushDuration,
                    ease: 'Power1'
                });
            }
        });

        this.physics.add.overlap(this.player.attackHitbox, this.monsters, (hitbox, monster) => {
            monster.die();
        });

        // Fade si viene de GameOver
        this.cameras.main.setAlpha(1);
        if (data?.fromGameOver) {
            this.cameras.main.setAlpha(0);
            this.tweens.add({ targets: this.cameras.main, alpha:1, duration:1000, ease:'Linear' });
        }
    }

    update(time, delta) {
        if (this.gameIsOver) return;

        // --- ACTUALIZAR ANIMACIÓN DE TILES ---
        this.animatedTiles.forEach(anim => {
            anim.timer += delta;
            if (anim.timer >= anim.duration) {
                anim.timer = 0;
                anim.index = (anim.index + 1) % anim.frames.length;
                anim.positions.forEach(pos => {
                    this.groundLayer.putTileAt(anim.frames[anim.index], pos.x, pos.y);
                });
            }
        });

        // Actualizar jugador y monstruos
        this.player.update(this.cursors);
        this.monsters.getChildren().forEach(monster => monster.actualizar());

        if (Phaser.Input.Keyboard.JustDown(this.keyG)) this.guardarPartida();
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) this.player.attack();
    }

    playerDied() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;
        if (this.music) this.music.stop();
        if (this.timerEvent) this.timerEvent.remove();

        this.time.delayedCall(0, () => {
            this.scene.start('GameOverScene', { x: this.player.x, y: this.player.y });
        });
    }

    guardarPartida() {
        fetch("/php/guardar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tiempo: this.segundos })
        })
        .then(res => res.json())
        .then(data => console.log("Partida guardada:", data))
        .catch(err => console.error(err));
    }
}
