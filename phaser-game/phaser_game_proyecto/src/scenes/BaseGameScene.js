import Player from '../entities/player.js';
import Monster from '../entities/monster.js';
import MonsterFlower from '../entities/MonsterFlower.js';
import MonsterSpear from '../entities/MonsterSpear.js';
import MonsterLizard from '../entities/MonsterLizard.js';
import DialogueSystem from '../scenes/DialogueSystem.js';

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
            displayName: 'Isla de Suelo',
            playerSpawn: { x: 200, y: 200 },
            savepoints: [],
            monsters: [
                { type: 'monster', x: 100, y: 300 },
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
    // PRELOAD
    // ─────────────────────────────────────────────
    preload() {
        const cfg = this.getRoomConfig();
        const roomKey = this.scene.key;

        this.load.image(`tiles_${roomKey}`, `/src/assets/tiles/${cfg.tilesetImage}`);
        this.load.tilemapTiledJSON(`map_${roomKey}`, `/src/assets/tiles/${cfg.map}.json`);

        this.load.audio(cfg.music, `/src/assets/sounds/${cfg.music}`);
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword',  '/src/assets/sounds/snd_sword.wav');
        this.load.image('healthbar',  '/src/assets/sprites/spr_hp_bar.png');

        // ── NUEVO: item curativo ──────────────────────────────
        this.load.image('spr_board_candy', '/src/assets/sprites/spr_board_candy.png');
        // ─────────────────────────────────────────────────────

        // Sonidos del sistema de diálogo
        this.load.audio('snd_board_text_main',     '/src/assets/sounds/snd_board_text_main.wav');
        this.load.audio('snd_board_text_main_end', '/src/assets/sounds/snd_board_text_main_end.wav');
        this.load.audio('snd_board_lift',          '/src/assets/sounds/snd_board_lift.wav');

        // Sprites de Kris
        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`${dir}${i}`, `/src/assets/sprites/spr_kris_${dir}/spr_kris_${i}.png`);
            for (let i = 0; i < 3; i++)
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
        });

        // Monster normal
        this.load.image('monster_right_0', '/src/assets/sprites/spr_monster/spr_monster_0.png');
        this.load.image('monster_right_1', '/src/assets/sprites/spr_monster/spr_monster_1.png');
        for (let i = 0; i < 3; i++)
            this.load.image(`monster_defeat_${i}`, `/src/assets/sprites/spr_monster_defeat/spr_defeat_${i}.png`);

        // MonsterFlower
        for (let i = 0; i < 2; i++)
            this.load.image(`flower_${i}`, `/src/assets/sprites/spr_flower/spr_flower_${i}.png`);
        for (let i = 0; i < 2; i++)
            this.load.image(`telegraph_${i}`, `/src/assets/sprites/spr_telegraph/spr_telegraph_${i}.png`);
        this.load.image('spr_smallbullet',         '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('spr_smallbullet_outline', '/src/assets/sprites/spr_smallbullet_outline.png');

        // MonsterSpear
        this.load.image('monster_angry_0', '/src/assets/sprites/spr_monster_angery/spr_board_monster_angery_0.png');
        this.load.image('monster_angry_1', '/src/assets/sprites/spr_monster_angery/spr_board_monster_angery_1.png');
        this.load.image('spr_spear',       '/src/assets/sprites/spr_spear.png');

        // MonsterLizard — todos los tipos y variantes
        const lizardVariants = ['', '_alt', '_jumpy'];
        const lizardDirs     = ['l', 'r'];
        lizardVariants.forEach(v => {
            lizardDirs.forEach(d => {
                for (let i = 0; i < 2; i++)
                    this.load.image(
                        `lizard_${d}${v}_${i}`,
                        `/src/assets/sprites/spr_lizard/spr_board_lizard_${d}${v}/spr_board_lizard_${d}${v}_${i}.png`
                    );
            });
        });
        lizardDirs.forEach(d => {
            for (let i = 0; i < 2; i++)
                this.load.image(
                    `lizard_${d}_hurt_${i}`,
                    `/src/assets/sprites/spr_lizard/spr_board_lizard_${d}_hurt/spr_board_lizard_${d}_hurt_${i}.png`
                );
        });
        this.load.image('lizard_reticle', '/src/assets/sprites/spr_lizard/spr_board_throw_reticle.png');

        for (let i = 0; i < 4; i++) {
            this.load.image(`lightning_straight_${i}`, `/src/assets/sprites/spr_lizard/spr_board_lightningbullet_straight/spr_board_lightningbullet_straight_${i}.png`);
            this.load.image(`lightning_diag_${i}`,     `/src/assets/sprites/spr_lizard/spr_board_lightningbullet_diag/spr_board_lightningbullet_diag_${i}.png`);
        }

        // Savepoint
        for (let i = 0; i < 6; i++)
            this.load.image(`savepoint_${i}`, `/src/assets/sprites/spr_savepoint/spr_savepoint_${i}.png`);

        this.load.image('spr_heart', '/src/assets/sprites/spr_heart.png');
        this.load.audio('snd_save',  '/src/assets/sounds/snd_save.wav');
    }

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────
    create(data) {
        const cfg = this.getRoomConfig();

        this.gameIsOver    = false;
        this.cambiandoRoom = false;
        this.enSaveMenu    = false;
        this.segundos      = data?.segundos ?? 0;

        this._crearMapa(cfg);
        this._crearAnimaciones();

        this.keyZ    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyG    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.textoTiempo = this.add.text(16, 16, 'Tiempo: ' + this.segundos, {
            fontFamily: 'UndertaleFont',
            fontSize  : '18px',
            fill      : '#ffffff'
        }).setScrollFactor(0).setDepth(10).setResolution(10);

        this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => {
                this.segundos++;
                this.textoTiempo.setText('Tiempo: ' + this.segundos);
            }
        });

        // Música
        const currentMusic    = this.registry.get('currentMusic');
        const currentMusicKey = this.registry.get('currentMusicKey');

        if (currentMusic && currentMusicKey === cfg.music && currentMusic.isPlaying) {
            this.music = currentMusic;
        } else {
            if (currentMusic && currentMusic.isPlaying) currentMusic.stop();
            this.music = this.sound.add(cfg.music, { loop: true, volume: 0.5 });
            this.music.play();
            this.registry.set('currentMusicKey', cfg.music);
            this.registry.set('currentMusic', this.music);
        }

        this.attackSound = this.sound.add('snd_sword', { volume: 0.5 });
        this.hitSound    = this.sound.add('player_hit');

        // Jugador
        const spawn = data?.playerSpawn ?? cfg.playerSpawn;
        this.player = new Player(this, spawn.x, spawn.y);
        this.player.lastDamageTime = 0;

        const savedHP = this.registry.get('playerHP');
        if (savedHP !== undefined) this.player.vida = savedHP;

        // Grupos
        this.monsters     = this.physics.add.group();
        this.flowers      = [];
        this.spears       = [];
        this.lizards      = [];
        this.pellets      = this.physics.add.group();
        // ── NUEVO: grupo de drops curativos ──────────────────
        this.healthDrops  = this.physics.add.group();
        // ─────────────────────────────────────────────────────

        cfg.monsters.forEach(m => {
            if (m.type === 'flower') {
                this.flowers.push(new MonsterFlower(this, m.x, m.y));
            } else if (m.type === 'spear') {
                const spear = new MonsterSpear(this, m.x, m.y);
                this.spears.push(spear);
                this.monsters.add(spear);
            } else if (m.type === 'lizard') {
                const lizard = new MonsterLizard(this, m.x, m.y, m.lizardType ?? 0);
                this.lizards.push(lizard);
                this.monsters.add(lizard);
            } else {
                const monster = new Monster(this, m.x, m.y, 'monster_right_0');
                monster.play('monster-walk');
                this.monsters.add(monster);
            }
        });

        // Savepoints
        this._crearSavepoints(cfg);

        this._crearColisiones();

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        if (!data?.fromGameOver) {
            this.cameras.main.fadeIn(500, 0, 0, 0);
        }

        this.dialogue = new DialogueSystem(this);
        this.events.on('resume', this._alReanudar, this);
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────
    update(time, delta) {
        if (this.gameIsOver || this.cambiandoRoom || this.enSaveMenu) return;

        if (this.dialogue.update()) return;

        // Tiles animados
        this.animatedTiles.forEach(anim => {
            anim.timer += delta;
            if (anim.timer >= anim.duration) {
                anim.timer = 0;
                anim.index = (anim.index + 1) % anim.frames.length;
                const frame = anim.frames[anim.index];
                anim.groundPositions.forEach(pos => {
                    this.groundLayer.putTileAt(frame, pos.x, pos.y);
                });
                anim.wallPositions.forEach(pos => {
                    const t = this.wallsLayer.putTileAt(frame, pos.x, pos.y);
                    if (t) t.setCollision(true);
                });
            }
        });

        this.player.update(this.cursors);
        this.monsters.getChildren().forEach(m => m.actualizar());
        this.flowers.forEach(f => f.actualizar());
        this._checkSwordVsFlowers();
        this.pellets.getChildren().forEach(p => { if (p.updateColor) p.updateColor(delta); });

        if (Phaser.Input.Keyboard.JustDown(this.keyG)) this.abrirSaveMenu();

        const zPressed = Phaser.Input.Keyboard.JustDown(this.keyZ);
        if (zPressed) {
            if (this._estaCercaDeSavepoint()) {
                this.abrirSaveMenu();
            } else {
                this.player.attack();
            }
        }

        this._checkBordes();
    }

    // ─────────────────────────────────────────────
    // SAVEPOINTS
    // ─────────────────────────────────────────────
    _crearSavepoints(cfg) {
        this.savepointSprites = [];

        if (!cfg.savepoints || cfg.savepoints.length === 0) return;

        if (!this.anims.exists('savepoint-idle')) {
            this.anims.create({
                key: 'savepoint-idle',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `savepoint_${i}` })),
                frameRate: 8,
                repeat: -1
            });
        }

        cfg.savepoints.forEach(sp => {
            const sprite = this.physics.add.sprite(sp.x, sp.y, 'savepoint_0');
            sprite.play('savepoint-idle');
            sprite.setScale(1.5);
            sprite.setImmovable(true);
            sprite.body.allowGravity = false;
            this.savepointSprites.push(sprite);
        });

        this.physics.add.collider(this.player, this.savepointSprites);
    }

    _estaCercaDeSavepoint() {
        if (!this.savepointSprites || this.savepointSprites.length === 0) return false;
        const RANGO = 40;
        return this.savepointSprites.some(sp =>
            Phaser.Math.Distance.Between(this.player.x, this.player.y, sp.x, sp.y) < RANGO
        );
    }

    // ─────────────────────────────────────────────
    // ABRIR SAVE MENU
    // ─────────────────────────────────────────────
    abrirSaveMenu() {
        if (this.enSaveMenu) return;
        this.enSaveMenu = true;

        if (this.timerEvent) this.timerEvent.paused = true;

        const cfg = this.getRoomConfig();

        this.scene.pause();
        this.scene.launch('SaveScene', {
            callerScene : this.scene.key,
            segundos    : this.segundos,
            playerHP    : this.player.vida,
            roomName    : cfg.displayName ?? this.scene.key,
            playerName  : this.registry.get('playerName')  ?? 'KRIS',
            playerLevel : this.registry.get('playerLevel') ?? 1
        });
    }

    _alReanudar() {
        this.enSaveMenu = false;
        if (this.timerEvent) this.timerEvent.paused = false;
    }

    // ─────────────────────────────────────────────
    // SETUP PRIVADO
    // ─────────────────────────────────────────────
    _crearMapa(cfg) {
        const roomKey = this.scene.key;

        this.map = this.make.tilemap({ key: `map_${roomKey}` });
        const tileset = this.map.addTilesetImage(cfg.tilesetName, `tiles_${roomKey}`);

        this.groundLayer = this.map.createLayer('ground', tileset, 0, 0);
        this.wallsLayer  = this.map.createLayer('walls', tileset, 0, 0);
        this.wallsLayer.setCollisionByProperty({ collides: true });

        this.animatedTiles = [];
        const mapJSON     = this.cache.tilemap.get(`map_${roomKey}`).data;
        const tilesetJSON = mapJSON.tilesets[0];

        if (tilesetJSON.tiles) {
            tilesetJSON.tiles.forEach(tile => {
                if (tile.animation) {
                    const frames   = tile.animation.map(f => f.tileid + tilesetJSON.firstgid);
                    const duration = tile.animation[0].duration;
                    const tileId   = tile.id + tilesetJSON.firstgid;
                    this.animatedTiles.push({
                        tileId, frames, index: 0, timer: 0, duration,
                        groundPositions: [], wallPositions: []
                    });
                }
            });

            this.animatedTiles.forEach(anim => {
                this.groundLayer.forEachTile(tile => {
                    if (tile.index === anim.tileId) anim.groundPositions.push({ x: tile.x, y: tile.y });
                });
                this.wallsLayer.forEachTile(tile => {
                    if (tile.index === anim.tileId) anim.wallPositions.push({ x: tile.x, y: tile.y });
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

        makeAnim('flower-idle',      ['flower_0', 'flower_1'], 4);
        makeAnim('flower-telegraph', ['telegraph_0', 'telegraph_1'], 8);
    }

    _crearColisiones() {
        this.physics.add.collider(this.monsters, this.monsters);
        this.physics.add.collider(this.player,   this.wallsLayer);
        this.physics.add.collider(this.monsters, this.wallsLayer);

        this.physics.add.overlap(this.player, this.monsters, (player, monster) => {
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

        this.physics.add.overlap(this.player, this.pellets, (player, pellet) => {
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10);
                player.lastDamageTime = ahora;
                this.hitSound.play();
            }
            pellet.destroy();
        });

        this.physics.add.overlap(this.player.attackHitbox, this.pellets, (hitbox, pellet) => {
            pellet.destroy();
        });

        // ── NUEVO: jugador recoge HealthDrop al tocarlo ───────
        this.physics.add.overlap(
            this.player,
            this.healthDrops,
            (player, drop) => drop.collect(player),
            null,
            this
        );
        // ─────────────────────────────────────────────────────
    }

    _checkSwordVsFlowers() {
        if (!this.player.attackHitbox?.active) return;
        const hitBounds = this.player.attackHitbox.getBounds();
        this.flowers.forEach(flower => {
            if (flower.isDead) return;
            if (Phaser.Geom.Intersects.RectangleToRectangle(hitBounds, flower.getBounds())) {
                flower.die();
            }
        });
    }

    // ─────────────────────────────────────────────
    // BORDES Y TRANSICIONES
    // ─────────────────────────────────────────────
    _checkBordes() {
        const cfg  = this.getRoomConfig();
        const p    = this.player;
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
        this.cambiarRoom(door.goTo, door.spawn);
    }

    cambiarRoom(roomKey, spawnPos) {
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
}