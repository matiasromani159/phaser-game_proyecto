import Player from '../entities/player.js';
import Monster from '../entities/monster.js';
import MonsterFlower from '../entities/MonsterFlower.js';
import MonsterSpear from '../entities/MonsterSpear.js';
import MonsterLizard from '../entities/MonsterLizard.js';
import MonsterBlueFish from '../entities/MonsterBlueFish.js';
import MonsterCatSinging from '../entities/MonsterCatSinging.js';
import MonsterSilentCat from '../entities/MonsterSilentCat.js';
import DialogueSystem from '../scenes/DialogueSystem.js';
import GameState from '../GameState.js';
import Boat from '../entities/Boat.js';
import AICompanionScene from './AICompanionScene.js';

// IDs de tiles de agua
const AGUA_IDS = new Set([512, 513, 514, 515, 516]);

// Rooms que tienen acceso a la IA (fácil de editar desde aquí)
const ROOMS_CON_IA = ['Room1', 'Room19'];

export default class BaseGameScene extends Phaser.Scene {

    getRoomConfig() {
        return {
            map: 'Suelomapa',
            tilesetName: 'tipe',
            tilesetImage: 'tipe.png',
            music: 'tenna_island.ogg',
            displayName: 'Isla de Suelo',
            playerSpawn: { x: 200, y: 200 },
            savepoints: [],
            monsters: [{ type: 'monster', x: 100, y: 300 }],
            doors: { arriba: null, abajo: null, izquierda: null, derecha: null }
        };
    }

    constructor(key) {
        super({ key });
        this.iaDisponible = ROOMS_CON_IA.includes(key);
    }

    preload() {
        const cfg = this.getRoomConfig();
        const roomKey = this.scene.key;

        this.load.image(`tiles_${roomKey}`, `/src/assets/tiles/${cfg.tilesetImage}`);
        this.load.tilemapTiledJSON(`map_${roomKey}`, `/src/assets/tiles/${cfg.map}.json`);

        this.load.audio(cfg.music, `/src/assets/sounds/${cfg.music}`);
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword', '/src/assets/sounds/snd_sword.wav');
        this.load.audio('snd_board_damage', '/src/assets/sounds/snd_board_damage.wav');
        this.load.image('healthbar', '/src/assets/sprites/spr_hp_bar.png');
        this.load.image('spr_board_candy', '/src/assets/sprites/spr_board_candy.png');
        this.load.audio('snd_power', '/src/assets/sounds/snd_power.wav');
        this.load.audio('root_8bit', '/src/assets/sounds/root_8bit.ogg');
        this.load.audio('snd_escape', '/src/assets/sounds/snd_escape.wav');
        this.load.audio('snd_board_door_close', '/src/assets/sounds/snd_board_door_close.wav');

        this.load.image('spr_board_raft', '/src/assets/sprites/spr_board_raft.png');
        this.load.image('spr_board_dock', '/src/assets/sprites/spr_board_dock.png');

        for (let i = 0; i < 9; i++)
            this.load.image(`smokepuff_${i}`, `/src/assets/sprites/spr_board_smokepuff/spr_board_smokepuff_${i}.png`);

        this.load.audio('snd_board_text_main', '/src/assets/sounds/snd_board_text_main.wav');
        this.load.audio('snd_board_text_main_end', '/src/assets/sounds/snd_board_text_main_end.wav');
        this.load.audio('snd_board_lift', '/src/assets/sounds/snd_board_lift.wav');

        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`${dir}${i}`, `/src/assets/sprites/spr_kris_${dir}/spr_kris_${i}.png`);
            for (let i = 0; i < 3; i++)
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
        });

        this.load.image('monster_right_0', '/src/assets/sprites/spr_monster/spr_monster_0.png');
        this.load.image('monster_right_1', '/src/assets/sprites/spr_monster/spr_monster_1.png');
        for (let i = 0; i < 3; i++)
            this.load.image(`monster_defeat_${i}`, `/src/assets/sprites/spr_monster_defeat/spr_defeat_${i}.png`);

        for (let i = 0; i < 2; i++) this.load.image(`flower_${i}`, `/src/assets/sprites/spr_flower/spr_flower_${i}.png`);
        for (let i = 0; i < 2; i++) this.load.image(`telegraph_${i}`, `/src/assets/sprites/spr_telegraph/spr_telegraph_${i}.png`);
        this.load.image('spr_smallbullet', '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('spr_smallbullet_outline', '/src/assets/sprites/spr_smallbullet_outline.png');

        this.load.image('monster_angry_0', '/src/assets/sprites/spr_monster_angery/spr_board_monster_angery_0.png');
        this.load.image('monster_angry_1', '/src/assets/sprites/spr_monster_angery/spr_board_monster_angery_1.png');
        this.load.image('spr_spear', '/src/assets/sprites/spr_spear.png');

        const lizardVariants = ['', '_alt', '_jumpy'];
        const lizardDirs = ['l', 'r'];
        lizardVariants.forEach(v => {
            lizardDirs.forEach(d => {
                for (let i = 0; i < 2; i++)
                    this.load.image(`lizard_${d}${v}_${i}`, `/src/assets/sprites/spr_lizard/spr_board_lizard_${d}${v}/spr_board_lizard_${d}${v}_${i}.png`);
            });
        });
        lizardDirs.forEach(d => {
            for (let i = 0; i < 2; i++)
                this.load.image(`lizard_${d}_hurt_${i}`, `/src/assets/sprites/spr_lizard/spr_board_lizard_${d}_hurt/spr_board_lizard_${d}_hurt_${i}.png`);
        });
        this.load.image('lizard_reticle', '/src/assets/sprites/spr_lizard/spr_board_throw_reticle.png');

        for (let i = 0; i < 4; i++) {
            this.load.image(`lightning_straight_${i}`, `/src/assets/sprites/spr_lizard/spr_board_lightningbullet_straight/spr_board_lightningbullet_straight_${i}.png`);
            this.load.image(`lightning_diag_${i}`, `/src/assets/sprites/spr_lizard/spr_board_lightningbullet_diag/spr_board_lightningbullet_diag_${i}.png`);
        }

        for (let i = 0; i < 2; i++) {
            this.load.image(`cat_singing_${i}`, `/src/assets/sprites/spr_board_cat_singing/spr_board_cat_singing/spr_board_cat_singing_${i}.png`);
            this.load.image(`cat_singing_hurt_${i}`, `/src/assets/sprites/spr_board_cat_singing/spr_board_cat_singing_hurt/spr_board_cat_singing_hurt_${i}.png`);
        }
        this.load.image('spr_musical_notes', '/src/assets/sprites/spr_board_cat_singing/spr_musical_notes.png');
        this.load.audio('snd_crowd', '/src/assets/sounds/snd_crowd.wav');

        for (let i = 0; i < 2; i++)
            this.load.image(`silent_cat_${i}`, `/src/assets/sprites/spr_board_cat_silent/spr_board_cat_silent_${i}.png`);

        ['r', 'l', 'u', 'd'].forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`bluefish_${dir}_${i}`, `/src/assets/sprites/spr_bluefish/spr_board_bluefish_${dir}/spr_board_bluefish_${dir}_${i}.png`);
        });

        for (let i = 0; i < 6; i++)
            this.load.image(`savepoint_${i}`, `/src/assets/sprites/spr_savepoint/spr_savepoint_${i}.png`);

        this.load.image('spr_heart', '/src/assets/sprites/spr_heart.png');
        this.load.audio('snd_save', '/src/assets/sounds/snd_save.wav');
    }

    create(data) {
        
        const cfg = this.getRoomConfig();

        this.gameIsOver = false;
        this.cambiandoRoom = false;
        this.enSaveMenu = false;
        this.enBarco = false;
        this.segundos = data?.segundos ?? 0;

        this._crearMapa(cfg);
        this._crearAnimaciones();

        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.textoTiempo = this.add.text(16, 16, 'Tiempo: ' + this.segundos, {
            fontFamily: 'UndertaleFont', fontSize: '18px', fill: '#ffffff'
        }).setScrollFactor(0).setDepth(10).setResolution(10);

        this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => { this.segundos++; this.textoTiempo.setText('Tiempo: ' + this.segundos); }
        });

        const currentMusic = this.registry.get('currentMusic');
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
        this.hitSound = this.sound.add('player_hit');

        const spawn = data?.playerSpawn ?? cfg.playerSpawn;
        this.player = new Player(this, spawn.x, spawn.y);
        this.player.setDepth(5);
        this.player.lastDamageTime = 0;

        this.monsters = this.physics.add.group();
        this.flowers = [];
        this.spears = [];
        this.lizards = [];
        this.bluefishes = [];
        this.cats = [];
        this.silentCats = [];
        this.pellets = this.physics.add.group();
        this.healthDrops = this.physics.add.group();

        cfg.monsters.forEach((m, i) => {
            const deadId = `${this.scene.key}_${m.type}_${i}`;
            if (GameState.estaMuerto(deadId)) return;
            if (m.type === 'flower') {
                const flower = new MonsterFlower(this, m.x, m.y); flower.deadId = deadId; this.flowers.push(flower);
            } else if (m.type === 'spear') {
                const spear = new MonsterSpear(this, m.x, m.y); spear.deadId = deadId; this.spears.push(spear); this.monsters.add(spear);
            } else if (m.type === 'lizard') {
                const lizard = new MonsterLizard(this, m.x, m.y, m.lizardType ?? 0); lizard.deadId = deadId; this.lizards.push(lizard); this.monsters.add(lizard);
            } else if (m.type === 'cat') {
                const cat = new MonsterCatSinging(this, m.x, m.y); cat.deadId = deadId; this.cats.push(cat); this.monsters.add(cat);
            } else if (m.type === 'silentcat') {
                const sc = new MonsterSilentCat(this, m.x, m.y); sc.deadId = deadId; this.silentCats.push(sc); this.monsters.add(sc);
            } else if (m.type === 'bluefish') {
                const bf = new MonsterBlueFish(this, m.x, m.y); bf.deadId = deadId; this.bluefishes.push(bf); this.monsters.add(bf);
            } else {
                const monster = new Monster(this, m.x, m.y, 'monster_right_0'); monster.deadId = deadId; monster.play('monster-walk'); this.monsters.add(monster);
            }
        });

        this._crearSavepoints(cfg);
        this._crearBarco(cfg);
        this._crearColisiones();

        if (GameState.enBarco && this.boat) this._subirAlBarco();

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.TILE_BIAS = 32;

        if (!data?.fromGameOver) this.cameras.main.fadeIn(500, 0, 0, 0);

        // Inicializar IA si esta room lo permite
        if (this.iaDisponible) {
            this._inicializarIA();
        }

        this.dialogue = new DialogueSystem(this, this.getDialogueConfig());
        this.events.on('resume', this._alReanudar, this);

          if (this.iaDisponible) {
            this._iaIndicator = this.add.container(this.scale.width - 6, this.scale.height - 6);
            
            const iaBg = this.add.rectangle(0, 0, 44, 16, 0x000000, 0.6)
                .setOrigin(1, 1)
                .setStrokeStyle(1, 0xffd700);

            const iaIcon = this.add.text(-38, -8, '★', {
                fontFamily: 'UndertaleFont, monospace',
                fontSize: '8px',
                color: '#ffd700',
            }).setOrigin(0.5).setResolution(10);

            const iaText = this.add.text(-20, -8, 'H = IA', {
                fontFamily: 'UndertaleFont, monospace',
                fontSize: '7px',
                color: '#ffd700',
            }).setOrigin(0.5).setResolution(10);

            this._iaIndicator.add([iaBg, iaIcon, iaText]);
            this._iaIndicator.setDepth(9999);
            this._iaIndicator.setScrollFactor(0);

            // Parpadeo sutil
            this.tweens.add({
                targets: this._iaIndicator,
                alpha: 0.5,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        // ⬆️ HASTA AQUÍ ⬆️
    
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.keyP))
            console.log(`x: ${Math.round(this.player.x)}, y: ${Math.round(this.player.y)}`);

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
                    if (t) {
                        if (AGUA_IDS.has(anim.tileId)) {
                            t.setCollision(!this.enBarco);
                        } else {
                            t.setCollision(true);
                        }
                    }
                });
            }
        });

        if (this.enBarco && this.boat) {
            this.boat.manejar(this.cursors, delta, this.wallsLayer);
            this.player.setPosition(this.boat.x, this.boat.y - 10);
            if (this.cursors.left.isDown) this.player.play('walk-left', true);
            else if (this.cursors.right.isDown) this.player.play('walk-right', true);
            else if (this.cursors.up.isDown) this.player.play('walk-up', true);
            else if (this.cursors.down.isDown) this.player.play('walk-down', true);
            else this.player.anims.stop();
            this.player.drawHealthBar();
        } else {
            this.player.update(this.cursors);
        }

        this.monsters.getChildren().forEach(m => m.actualizar(this.player));
        this.flowers.forEach(f => f.actualizar());
        this._checkSwordVsFlowers();
        this.pellets.getChildren().forEach(p => { if (p.updateColor) p.updateColor(delta); });

        if (Phaser.Input.Keyboard.JustDown(this.keyG)) this.abrirSaveMenu();

        const zPressed = Phaser.Input.Keyboard.JustDown(this.keyZ);
        if (zPressed) {
            if (this.enBarco && this._estaCercaDeDock()) this._bajarDelBarco();
            else if (!this.enBarco && this._estaCercaDeDock() && this._estaCercaDelBarco()) this._subirAlBarco();
            else if (this._estaCercaDeSavepoint()) this.abrirSaveMenu();
            else if (this._estaCercaDeNpc()) this._interactuarConNpc();
            else if (!this.enBarco) this.player.attack();
        }

        this._checkBordes();

        // Actualizar IA si está disponible
        if (this.iaDisponible) {
            this._actualizarIA();
        }
    }

    shutdown() {
        this.input.keyboard.removeAllKeys(true);
        this.events.off('resume', this._alReanudar, this);

        // Cerrar IA si está abierta al salir de la room
        if (this.iaDisponible) {
            const aiScene = this.scene.get('AICompanionScene');
            if (aiScene && aiScene.isOpen) {
                aiScene.close();
            }
        }
    }

    // ═════════════════════════════════════════════════════════
    // SISTEMA DE IA COMPANION (RALSEI)
    // ═════════════════════════════════════════════════════════

       // ═════════════════════════════════════════════════════════
    // SISTEMA DE IA COMPANION (RALSEI)
    // ═════════════════════════════════════════════════════════

        // ═════════════════════════════════════════════════════════
    // SISTEMA DE IA COMPANION (RALSEI)
    // ═════════════════════════════════════════════════════════

    _inicializarIA() {
    this.keyHelp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);

    const aiScene = this.scene.get('AICompanionScene');
    if (!aiScene) {
        console.error('[IA] AICompanionScene no encontrada en el registro');
        return;
    }

    aiScene.parentScene = this;

    if (this.game.geminiService) {
        aiScene.setGeminiService(this.game.geminiService);
    }

    // Arrancarla si no está activa aún
    if (!aiScene.scene.isActive() && !aiScene.scene.isSleeping()) {
        this.scene.launch('AICompanionScene');
    }
}

   _actualizarIA() {
    if (!Phaser.Input.Keyboard.JustDown(this.keyHelp)) return;

    const aiScene = this.scene.get('AICompanionScene');

    if (!aiScene) {
        console.warn('[IA] AICompanionScene no encontrada, reinicializando...');
        this._inicializarIA();
        return;
    }

    if (!aiScene.isReady) {
        console.warn('[IA] AICompanionScene aún no está lista');
        return;
    }

    // ← Solo actuar si el chat está CERRADO
    if (aiScene.isOpen) return;

    aiScene.parentScene = this;

    if (this.game.geminiService && !aiScene.gemini) {
        aiScene.setGeminiService(this.game.geminiService);
    }

    if (aiScene.scene.isSleeping()) {
        aiScene.scene.wake();
    }

    aiScene.toggle();
}  _estaCercaDeNpc() {
        if (!this.npc) return false;
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < 60;
    }

    _interactuarConNpc() { }

    _applyKnockback(player, sourceX, sourceY) {
        const KNOCKBACK_SPEED = 280, KNOCKBACK_DURATION = 150;
        let dx = player.x - sourceX, dy = player.y - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= dist; dy /= dist;
        player.isKnockedBack = true;
        player.setVelocity(dx * KNOCKBACK_SPEED, dy * KNOCKBACK_SPEED);
        this.time.delayedCall(KNOCKBACK_DURATION, () => {
            if (player?.body) { player.setVelocity(0, 0); player.isKnockedBack = false; }
        });
    }

    _crearSavepoints(cfg) {
        this.savepointSprites = [];
        if (!cfg.savepoints || cfg.savepoints.length === 0) return;
        if (!this.anims.exists('savepoint-idle')) {
            this.anims.create({
                key: 'savepoint-idle',
                frames: Array.from({ length: 6 }, (_, i) => ({ key: `savepoint_${i}` })),
                frameRate: 8, repeat: -1
            });
        }
        cfg.savepoints.forEach(sp => {
            const sprite = this.physics.add.sprite(sp.x, sp.y, 'savepoint_0');
            sprite.play('savepoint-idle');
            sprite.setDisplaySize(36, 36); sprite.setSize(20, 20);
            sprite.setImmovable(true); sprite.body.allowGravity = false;
            this.savepointSprites.push(sprite);
        });
        this.physics.add.collider(this.player, this.savepointSprites);
    }

    _estaCercaDeSavepoint() {
        if (!this.savepointSprites || this.savepointSprites.length === 0) return false;
        return this.savepointSprites.some(sp =>
            Phaser.Math.Distance.Between(this.player.x, this.player.y, sp.x, sp.y) < 40
        );
    }

    abrirSaveMenu() {
        if (this.enSaveMenu) return;
        this.enSaveMenu = true;
        if (this.timerEvent) this.timerEvent.paused = true;
        const cfg = this.getRoomConfig();
        this.scene.pause();
        this.scene.launch('SaveScene', {
            callerScene: this.scene.key, segundos: this.segundos, playerHP: this.player.vida,
            roomName: cfg.displayName ?? this.scene.key,
            playerName: this.registry.get('playerName') ?? GameState.playerName ?? 'KRIS',
            playerLevel: this.registry.get('playerLevel') ?? GameState.playerLevel ?? 1,
            playerSpawn: { x: Math.round(this.player.x), y: Math.round(this.player.y) }
        });
    }

    _alReanudar() {
        this.enSaveMenu = false;
        if (this.timerEvent) this.timerEvent.paused = false;
    }

    _spawnSmokePuff(x, y) {
        const puff = this.add.sprite(x, y, 'smokepuff_0');
        puff.setDepth(10);
        puff.play('smokepuff');
        puff.once('animationcomplete', () => puff.destroy());
    }

    _crearBarco(cfg) {
        this.boat = null;
        this.dockSprites = [];
        this._waterCollider = null;
        if (!cfg.boat) return;

        if (cfg.docks) {
            cfg.docks.forEach(d => {
                const dock = this.physics.add.sprite(d.x, d.y, 'spr_board_dock');
                dock.setDisplaySize(36, 36); dock.setDepth(0);
                dock.setImmovable(true); dock.body.allowGravity = false;
                this.dockSprites.push({ sprite: dock, x: d.x, y: d.y });
            });
        }

        this.boat = new Boat(this, cfg.boat.x, cfg.boat.y);
        if (cfg.boatBounds) this.boat.setBounds(cfg.boatBounds);
        this.physics.add.collider(this.boat, this.wallsLayer);
        this.physics.add.collider(this.boat, this.diagonalBodies);
    }

    _setWaterCollision(active) {
        this.wallsLayer.forEachTile(tile => {
            if (AGUA_IDS.has(tile.index)) {
                tile.setCollision(active);
            }
        });
    }

    _estaCercaDeDock() {
        if (!this.dockSprites || this.dockSprites.length === 0) return false;
        const ref = this.enBarco ? this.boat : this.player;
        return this.dockSprites.some(d => Phaser.Math.Distance.Between(ref.x, ref.y, d.x, d.y) < 40);
    }

    _estaCercaDelBarco() {
        if (!this.boat) return false;
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boat.x, this.boat.y) < 50;
    }

    _subirAlBarco() {
        this.enBarco = true;
        GameState.enBarco = true;
        this._setWaterCollision(false);
        this.player.setVelocity(0, 0);
        this.player.setDepth(6);
    }

    _bajarDelBarco() {
        this.enBarco = false;
        GameState.enBarco = false;
        this._setWaterCollision(true);
        const dockCercano = this.dockSprites.find(d =>
            Phaser.Math.Distance.Between(this.boat.x, this.boat.y, d.x, d.y) < 40
        );
        if (dockCercano) this.player.setPosition(dockCercano.x, dockCercano.y);
        this.boat.detener();
        this.player.setDepth(5);
    }

    _crearMapa(cfg) {
        const roomKey = this.scene.key;
        this.map = this.make.tilemap({ key: `map_${roomKey}` });
        const tileset = this.map.addTilesetImage(cfg.tilesetName, `tiles_${roomKey}`);

        this.groundLayer = this.map.createLayer('ground', tileset, 0, 0);
        this.wallsLayer = this.map.createLayer('walls', tileset, 0, 0);
        this.wallsLayer.setCollisionByProperty({ collides: true });

        this._crearColisionDiagonal();

        this.waterTilePositions = new Set();
        this.wallsLayer.forEachTile(tile => {
            if (AGUA_IDS.has(tile.index))
                this.waterTilePositions.add(`${tile.x},${tile.y}`);
        });

        this.animatedTiles = [];
        const mapJSON = this.cache.tilemap.get(`map_${roomKey}`).data;
        const tilesetJSON = mapJSON.tilesets[0];

        if (tilesetJSON.tiles) {
            tilesetJSON.tiles.forEach(tile => {
                if (tile.animation) {
                    const tileId = tile.id + tilesetJSON.firstgid;
                    const duration = tile.animation[0].duration;
                    const frames = tile.animation
                        .map(f => f.tileid + tilesetJSON.firstgid)
                        .filter(f => f <= tilesetJSON.tilecount);
                    this.animatedTiles.push({
                        tileId, frames, index: 0, timer: 0, duration,
                        groundPositions: [], wallPositions: []
                    });
                }
            });

            this.animatedTiles.forEach(anim => {
                this.groundLayer.forEachTile(tile => {
                    if (anim.frames.includes(tile.index))
                        anim.groundPositions.push({ x: tile.x, y: tile.y });
                });
                this.wallsLayer.forEachTile(tile => {
                    if (tile.index === anim.tileId)
                        anim.wallPositions.push({ x: tile.x, y: tile.y });
                });
            });
        }
    }

    _crearColisionDiagonal() {
        const TW = this.map.tileWidth, TH = this.map.tileHeight;
        const DIAGONALES = { 265: 'top-right', 297: 'right', 313: 'bottom-right', 233: 'bottom-left' };

        this.wallsLayer.forEachTile(tile => {
            if (DIAGONALES[tile.index] !== undefined) tile.setCollision(false);
        });

        this.diagonalBodies = this.physics.add.staticGroup();
        this.wallsLayer.forEachTile(tile => {
            const orientation = DIAGONALES[tile.index];
            if (orientation === undefined) return;
            const tx = tile.pixelX, ty = tile.pixelY, step = TW / 3;
            const configs = {
                'top-right': [{ x: tx + step * 2, y: ty, w: step, h: TH / 3 }, { x: tx + step, y: ty + TH / 3, w: step * 2, h: TH / 3 }, { x: tx, y: ty + (TH / 3) * 2, w: TW, h: TH / 3 }],
                'right': [{ x: tx + step * 2, y: ty, w: step, h: TH / 3 }, { x: tx + step, y: ty + TH / 3, w: step * 2, h: TH / 3 }, { x: tx + step * 2, y: ty + (TH / 3) * 2, w: step, h: TH / 3 }],
                'bottom-right': [{ x: tx, y: ty, w: TW, h: TH / 3 }, { x: tx + step, y: ty + TH / 3, w: step * 2, h: TH / 3 }, { x: tx + step * 2, y: ty + (TH / 3) * 2, w: step, h: TH / 3 }],
                'bottom-left': [{ x: tx, y: ty, w: TW, h: TH / 3 }, { x: tx, y: ty + TH / 3, w: step * 2, h: TH / 3 }, { x: tx, y: ty + (TH / 3) * 2, w: step, h: TH / 3 }],
            };
            configs[orientation].forEach(r => {
                const body = this.diagonalBodies.create(r.x + r.w / 2, r.y + r.h / 2, null);
                body.setVisible(false); body.displayWidth = r.w; body.displayHeight = r.h; body.refreshBody();
            });
        });
    }

    _crearAnimaciones() {
        const makeAnim = (key, frames, fps = 6, repeat = -1) => {
            if (this.anims.exists(key)) return;
            this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fps, repeat });
        };

        makeAnim('walk-down', ['down0', 'down1']);
        makeAnim('walk-up', ['up0', 'up1']);
        makeAnim('walk-left', ['left0', 'left1']);
        makeAnim('walk-right', ['right0', 'right1']);
        makeAnim('monster-walk', ['monster_right_0', 'monster_right_1']);
        makeAnim('monster-die', ['monster_defeat_0', 'monster_defeat_1', 'monster_defeat_2'], 12, 0);

        ['down', 'up', 'left', 'right'].forEach(dir =>
            makeAnim(`attack-${dir}`, [`${dir}Attack0`, `${dir}Attack1`, `${dir}Attack2`], 10, 0)
        );

        makeAnim('flower-idle', ['flower_0', 'flower_1'], 4);
        makeAnim('flower-telegraph', ['telegraph_0', 'telegraph_1'], 8);
        makeAnim('cat-singing', ['cat_singing_0', 'cat_singing_1'], 6);
        makeAnim('cat-singing-hurt', ['cat_singing_hurt_0', 'cat_singing_hurt_1'], 6);

        ['r', 'l', 'u', 'd'].forEach(dir =>
            makeAnim(`bluefish-${dir}`, [`bluefish_${dir}_0`, `bluefish_${dir}_1`], 6)
        );

        makeAnim('smokepuff', Array.from({ length: 9 }, (_, i) => `smokepuff_${i}`), 12, 0);
    }

    _crearColisiones() {
        this.physics.add.collider(this.monsters, this.monsters);
        this.physics.add.collider(this.player, this.wallsLayer);
        this.physics.add.collider(this.monsters, this.wallsLayer);
        this.physics.add.collider(this.player, this.diagonalBodies);
        this.physics.add.collider(this.monsters, this.diagonalBodies);

        this.physics.add.overlap(this.player, this.monsters, (player, monster) => {
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10); player.lastDamageTime = ahora;
                this.hitSound.play(); this._applyKnockback(player, monster.x, monster.y);
            }
        });

        this.physics.add.overlap(this.player.attackHitbox, this.monsters, (hitbox, monster) => {
            if (monster.recibirDaño) {
                const murio = monster.recibirDaño(10, this.player.x, this.player.y);
                if (murio && monster.deadId) GameState.matarMonstruo(monster.deadId);
            } else {
                monster.die();
                if (monster.deadId) GameState.matarMonstruo(monster.deadId);
            }
        });

        this.physics.add.overlap(this.player, this.pellets, (player, pellet) => {
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(10); player.lastDamageTime = ahora;
                this.hitSound.play(); this._applyKnockback(player, pellet.x, pellet.y);
            }
            pellet.destroy();
        });

        this.physics.add.overlap(this.player.attackHitbox, this.pellets, (hitbox, pellet) => pellet.destroy());

        this.physics.add.overlap(this.player, this.healthDrops, (player, drop) => {
            drop.collect(player); this.sound.play('snd_power', { volume: 0.7 });
        }, null, this);
    }

    _checkSwordVsFlowers() {
        if (!this.player.attackHitbox?.active) return;
        const hitBounds = this.player.attackHitbox.getBounds();
        this.flowers.forEach(flower => {
            if (flower.isDead) return;
            if (Phaser.Geom.Intersects.RectangleToRectangle(hitBounds, flower.getBounds())) {
                if (flower.recibirDaño) {
                    const murio = flower.recibirDaño(10, this.player.x, this.player.y);
                    if (murio && flower.deadId) GameState.matarMonstruo(flower.deadId);
                } else {
                    flower.die();
                    if (flower.deadId) GameState.matarMonstruo(flower.deadId);
                }
            }
        });
    }

    _checkBordes() {
        const cfg = this.getRoomConfig();
        const p = this.player;
        const mapW = this.map.widthInPixels, mapH = this.map.heightInPixels, margen = 36;
        if (cfg.doors.arriba && p.y < margen) this._activarPuerta(cfg.doors.arriba);
        if (cfg.doors.abajo && p.y > mapH - margen) this._activarPuerta(cfg.doors.abajo);
        if (cfg.doors.izquierda && p.x < margen) this._activarPuerta(cfg.doors.izquierda);
        if (cfg.doors.derecha && p.x > mapW - margen) this._activarPuerta(cfg.doors.derecha);
    }

    _activarPuerta(door) {
        if (this.cambiandoRoom) return;
        this.cambiandoRoom = true;
        this.cambiarRoom(door.goTo, door.spawn);
    }

    cambiarRoom(roomKey, spawnPos) {
        if (this.timerEvent) this.timerEvent.remove();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(roomKey, { segundos: this.segundos, playerSpawn: spawnPos });
        });
    }

    playerDied() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;
        if (this.music) this.music.stop();
        if (this.timerEvent) this.timerEvent.remove();
        GameState.enBarco = false;
        this.registry.set('lastRoom', this.scene.key);
        this.scene.start('GameOverScene', { x: this.player.x, y: this.player.y });
    }
}