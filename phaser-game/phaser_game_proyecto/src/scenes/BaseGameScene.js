import Player from '../entities/player.js';
import Monster from '../entities/monster.js';

/**
 * BaseGameScene — Clase padre para todas las rooms.
 * Cada room hija solo necesita sobreescribir getRoomConfig().
 */
export default class BaseGameScene extends Phaser.Scene {

    // ─────────────────────────────────────────────
    // OVERRIDE ESTO EN CADA ROOM HIJA
    // ─────────────────────────────────────────────
    getRoomConfig() {
        return {
            map: 'Suelomapa',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',
            playerSpawn: { x: 200, y: 200 },
            monsters: [
                { x: 100, y: 300 }
            ],
            doors: {
                arriba:    null,
                abajo:     null,
                izquierda: null,
                derecha:   null
            }
        };
    }

    // ─────────────────────────────────────────────
    // PRELOAD — claves únicas por room para evitar conflictos de cache
    // ─────────────────────────────────────────────
    preload() {
        const cfg = this.getRoomConfig();
        const roomKey = this.scene.key; // 'Room1', 'Room2', etc.

        // Tilemap con clave única por room
        this.load.image(`tiles_${roomKey}`, `/src/assets/tiles/${cfg.tilesetImage}`);
        this.load.tilemapTiledJSON(`map_${roomKey}`, `/src/assets/tiles/${cfg.map}.json`);

        // Música
        this.load.audio(cfg.music, `/src/assets/sounds/${cfg.music}`);

        // Sonidos comunes
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword', '/src/assets/sounds/snd_sword.wav');
        this.load.image('healthbar', '/src/assets/sprites/spr_hp_bar.png');

        // Sprites de Kris
        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`${dir}${i}`, `/src/assets/sprites/spr_kris_${dir}/spr_kris_${i}.png`);
            for (let i = 0; i < 3; i++)
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
        });

        // Sprites de monstruo
        this.load.image('monster_right_0', '/src/assets/sprites/spr_monster/spr_monster_0.png');
        this.load.image('monster_right_1', '/src/assets/sprites/spr_monster/spr_monster_1.png');
        for (let i = 0; i < 3; i++)
            this.load.image(`monster_defeat_${i}`, `/src/assets/sprites/spr_monster_defeat/spr_defeat_${i}.png`);
    }

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────
    create(data) {
        const cfg = this.getRoomConfig();

        this.gameIsOver = false;
        this.cambiandoRoom = false;
        this.segundos = data?.segundos ?? 0;

        this._crearMapa(cfg);
        this._crearAnimaciones();

        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.textoTiempo = this.add.text(16, 16, 'Tiempo: ' + this.segundos, {
            fontSize: '18px', fill: '#ffffff'
        }).setScrollFactor(0).setDepth(10);

        this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => {
                this.segundos++;
                this.textoTiempo.setText('Tiempo: ' + this.segundos);
            }
        });

        this.music = this.sound.add(cfg.music, { loop: true, volume: 0.5 });
        this.music.play();

        this.attackSound = this.sound.add('snd_sword', { volume: 0.5 });
        this.hitSound = this.sound.add('player_hit');

        const spawn = data?.playerSpawn ?? cfg.playerSpawn;
        this.player = new Player(this, spawn.x, spawn.y);
        this.player.lastDamageTime = 0;

        const savedHP = this.registry.get('playerHP');
        if (savedHP !== undefined) this.player.vida = savedHP;

        this.monsters = this.physics.add.group();
        cfg.monsters.forEach(m => {
            const monster = new Monster(this, m.x, m.y, 'monster_right_0');
            monster.play('monster-walk');
            this.monsters.add(monster);
        });

        this._crearColisiones();

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    //    this.cameras.main.fadeIn(500, 0, 0, 0);

       if (!data?.fromGameOver) {
    this.cameras.main.fadeIn(500, 0, 0, 0);
}
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────
    update(time, delta) {
        if (this.gameIsOver || this.cambiandoRoom) return;

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

        this.player.update(this.cursors);
        this.monsters.getChildren().forEach(m => m.actualizar());

        if (Phaser.Input.Keyboard.JustDown(this.keyG)) this.guardarPartida();
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) this.player.attack();

        this._checkBordes();
    }

    // ─────────────────────────────────────────────
    // MÉTODOS PRIVADOS DE SETUP
    // ─────────────────────────────────────────────
    _crearMapa(cfg) {
        const roomKey = this.scene.key;

        // Claves únicas por room — evita conflictos de cache entre rooms
        this.map = this.make.tilemap({ key: `map_${roomKey}` });
        const tileset = this.map.addTilesetImage(cfg.tilesetName, `tiles_${roomKey}`);

        this.groundLayer = this.map.createLayer('ground', tileset, 0, 0);
        this.wallsLayer  = this.map.createLayer('walls', tileset, 0, 0);
        this.wallsLayer.setCollisionByProperty({ collides: true });

        // Tiles animados
        this.animatedTiles = [];
        const mapJSON = this.cache.tilemap.get(`map_${roomKey}`).data;
        const tilesetJSON = mapJSON.tilesets[0];

        if (tilesetJSON.tiles) {
            tilesetJSON.tiles.forEach(tile => {
                if (tile.animation) {
                    const frames = tile.animation.map(f => f.tileid + tilesetJSON.firstgid);
                    const duration = tile.animation[0].duration;
                    const tileId = tile.id + tilesetJSON.firstgid;
                    this.animatedTiles.push({ tileId, frames, index: 0, timer: 0, duration, positions: [] });
                }
            });

            this.animatedTiles.forEach(anim => {
                this.groundLayer.forEachTile(tile => {
                    if (tile.index === anim.tileId) anim.positions.push({ x: tile.x, y: tile.y });
                });
            });
        }
    }

    _crearAnimaciones() {
        const makeAnim = (key, frames, fps = 6, repeat = -1) => {
            if (this.anims.exists(key)) return;
            this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fps, repeat });
        };

        makeAnim('walk-down',  ['down0', 'down1']);
        makeAnim('walk-up',    ['up0', 'up1']);
        makeAnim('walk-left',  ['left0', 'left1']);
        makeAnim('walk-right', ['right0', 'right1']);
        makeAnim('monster-walk', ['monster_right_0', 'monster_right_1']);
        makeAnim('monster-die',  ['monster_defeat_0', 'monster_defeat_1', 'monster_defeat_2'], 12, 0);

        ['down', 'up', 'left', 'right'].forEach(dir =>
            makeAnim(`attack-${dir}`, [`${dir}Attack0`, `${dir}Attack1`, `${dir}Attack2`], 10, 0)
        );
    }

    _crearColisiones() {
        this.physics.add.collider(this.player,   this.wallsLayer);
        this.physics.add.collider(this.monsters, this.wallsLayer);

        this.physics.add.collider(this.player, this.monsters, (player, monster) => {
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10);
                player.lastDamageTime = ahora;
                this.hitSound.play();

                const pushDistance = 32;
                let dx = player.x - monster.x;
                let dy = player.y - monster.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                dx /= dist; dy /= dist;

                this.tweens.add({
                    targets: player,
                    x: player.x + dx * pushDistance,
                    y: player.y + dy * pushDistance,
                    duration: 150,
                    ease: 'Power1'
                });
            }
        });

        this.physics.add.overlap(this.player.attackHitbox, this.monsters, (hitbox, monster) => {
            monster.die();
        });
    }

    // ─────────────────────────────────────────────
    // DETECCIÓN DE BORDES
    // ─────────────────────────────────────────────
    _checkBordes() {
        const cfg = this.getRoomConfig();
        const p = this.player;
        const mapW = this.map.widthInPixels;
        const mapH = this.map.heightInPixels;
        const margen = 36;

        if (cfg.doors.arriba    && p.y < margen)        this._activarPuerta(cfg.doors.arriba);
        if (cfg.doors.abajo     && p.y > mapH - margen) this._activarPuerta(cfg.doors.abajo);
        if (cfg.doors.izquierda && p.x < margen)        this._activarPuerta(cfg.doors.izquierda);
        if (cfg.doors.derecha   && p.x > mapW - margen) this._activarPuerta(cfg.doors.derecha);
    }

    _activarPuerta(door) {
        if (this.cambiandoRoom) return;
        this.cambiandoRoom = true;
        console.log('activando puerta hacia:', door.goTo);
        this.cambiarRoom(door.goTo, door.spawn);
    }

    // ─────────────────────────────────────────────
    // TRANSICIÓN ENTRE ROOMS
    // ─────────────────────────────────────────────
    cambiarRoom(roomKey, spawnPos) {
        if (this.music) this.music.stop();
        if (this.timerEvent) this.timerEvent.remove();

        this.registry.set('playerHP', this.player.vida);

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(roomKey, {
                segundos: this.segundos,
                playerSpawn: spawnPos
            });
        });
    }

    // ─────────────────────────────────────────────
    // MUERTE DEL JUGADOR
    // ─────────────────────────────────────────────
    playerDied() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;
        if (this.music) this.music.stop();
        if (this.timerEvent) this.timerEvent.remove();

        this.registry.set('lastRoom', this.scene.key);

        this.scene.start('GameOverScene', { x: this.player.x, y: this.player.y });
    }

    // ─────────────────────────────────────────────
    // GUARDAR PARTIDA
    // ─────────────────────────────────────────────
    guardarPartida() {
        fetch('/php/guardar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tiempo: this.segundos })
        })
        .then(res => res.json())
        .then(data => console.log('Partida guardada:', data))
        .catch(err => console.error(err));
    }
}