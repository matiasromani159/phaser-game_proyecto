import ShadowMantle                          from '../entities/ShadowMantle/ShadowMantle.js';
import { ShadowMantleEnemy }                 from '../entities/ShadowMantle/ShadowMantleEnemy.js';
import { ShadowMantleClone,
         ShadowMantleGroundfire,
         ShadowMantleFire3,
         ShadowMantleEnemySpawn }            from '../entities/ShadowMantle/ShadowMantleHelpers.js';
import { ShadowMantleBomb,
         ShadowMantleCloud,
         ShadowMantleCloudBullet }           from '../entities/ShadowMantle/ShadowMantleBomb.js';
import { ShadowMantleFire }                  from '../entities/ShadowMantle/ShadowMantleFire.js';
import { ShadowMantleFireController }        from '../entities/ShadowMantle/ShadowMantleFireController.js';
import Player                                from '../entities/player.js';

export default class BossScene extends Phaser.Scene {

    constructor() { super({ key: 'BossScene' }); }

    // ─────────────────────────────────────────────────────────
    // PRELOAD
    // ─────────────────────────────────────────────────────────
    preload() {
        // ── Mapa ─────────────────────────────────────────────
        this.load.image('tiles_boss',         '/src/assets/tiles/tipe.png');
        this.load.tilemapTiledJSON('map_boss', '/src/assets/tiles/boss_room.json');

        // ── Música ────────────────────────────────────────────
        this.load.audio('nightmare_boss', '/src/assets/sounds/nightmare_boss_heavy.ogg');

        // ── Player ────────────────────────────────────────────
        this.load.audio('player_hit', '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword',  '/src/assets/sounds/snd_sword.wav');
        this.load.image('healthbar',  '/src/assets/sprites/spr_hp_bar.png');
        this.load.image('spr_board_candy', '/src/assets/sprites/spr_board_candy.png');

        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`${dir}${i}`, `/src/assets/sprites/spr_kris_${dir}/spr_kris_${i}.png`);
            for (let i = 0; i < 3; i++)
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
        });

        // ── Boss sprites ──────────────────────────────────────
        const bossSprites = {
            'mantle_idle':                 { path: 'spr_shadow_mantle_idle',                 frames: 6 },
            'mantle_dash':                 { path: 'spr_shadow_mantle_dash',                 frames: 2 },
            'mantle_onfire':               { path: 'spr_shadow_mantle_onfire',               frames: 2 },
            'mantle_release':              { path: 'spr_shadow_mantle_release',              frames: 10 },
            'mantle_release_abbreviated':  { path: 'spr_shadow_mantle_release_abbreviated',  frames: 5 },
            'mantle_laugh':                { path: 'spr_shadow_mantle_laugh',                frames: 2 },
            'mantle_side_r':               { path: 'spr_shadow_mantle_side_r',               frames: 3 },
            'mantle_side_l':               { path: 'spr_shadow_mantle_side_l',               frames: 3 },
            'mantle_fire':                 { path: 'spr_shadow_mantle_fire',                 frames: 3 },
            'mantle_fire2':                { path: 'spr_shadow_mantle_fire2',                frames: 3 },
            'mantle_imonfire':             { path: 'spr_board_imonfire',                     frames: 2 },
        };

        Object.entries(bossSprites).forEach(([key, { path, frames }]) => {
            for (let i = 0; i < frames; i++) {
                this.load.image(`${key}_${i}`, `/src/assets/sprites/spr_boss/${path}/${path}_${i}.png`);
            }
        });

        // ── Proyectiles ───────────────────────────────────────
        this.load.image('mantle_bomb_0',          '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_bomb_shadow',      '/src/assets/sprites/spr_smallbullet_outline.png');
        this.load.image('mantle_cloud_0',          '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_1',          '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_2',          '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_3',          '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_bullet_0',   '/src/assets/sprites/spr_smallbullet.png');
        for (let i = 0; i < 2; i++)
            this.load.image(`mantle_cloud_projectile_${i}`,
                `/src/assets/sprites/spr_boss/spr_shadow_mantle_cloud_projectile/spr_shadow_mantle_cloud_projectile_${i}.png`);

        // ── Enemy sprites ─────────────────────────────────────
        this.load.image('enemy_appear_0', '/src/assets/sprites/spr_boss/gustavo.png');
        for (let i = 1; i < 6; i++)
            this.load.image(`enemy_appear_${i}`, '/src/assets/sprites/spr_boss/gustavo.png');
        for (let i = 0; i < 4; i++)
            this.load.image(`enemy_walk_${i}`, '/src/assets/sprites/spr_boss/gustavo.png');

        // ── Sonidos del boss ──────────────────────────────────
        this.load.audio('snd_board_bosshit',           '/src/assets/sounds/snd_boss/snd_board_bosshit.wav');
        this.load.audio('snd_board_mantle_laugh_mid',  '/src/assets/sounds/snd_boss/snd_board_mantle_laugh_mid.wav');
        this.load.audio('snd_board_mantle_dash_slow',  '/src/assets/sounds/snd_boss/snd_board_mantle_dash_slow.wav');
        this.load.audio('snd_board_mantle_dash_fast',  '/src/assets/sounds/snd_boss/snd_board_mantle_dash_fast.wav');
        this.load.audio('snd_board_throw',             '/src/assets/sounds/snd_boss/snd_board_throw.wav');
        this.load.audio('snd_bump',                    '/src/assets/sounds/snd_boss/snd_bump.wav');
        this.load.audio('snd_board_bomb',              '/src/assets/sounds/snd_boss/snd_board_bomb.wav');
        this.load.audio('snd_board_summon',            '/src/assets/sounds/snd_boss/snd_board_summon.wav');
        this.load.audio('snd_board_torch',             '/src/assets/sounds/snd_boss/snd_board_torch.wav');
        this.load.audio('snd_board_torch_high',        '/src/assets/sounds/snd_boss/snd_board_torch_high.wav');
        this.load.audio('snd_board_mantle_move',       '/src/assets/sounds/snd_boss/snd_board_mantle_move.wav');
        this.load.audio('snd_wing',                    '/src/assets/sounds/snd_boss/snd_wing.wav');

        // ── HUD ───────────────────────────────────────────────
        for (let i = 0; i < 6; i++)
            this.load.image(`savepoint_${i}`, `/src/assets/sprites/spr_savepoint/spr_savepoint_${i}.png`);
    }

    // ─────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────
    create(data) {
        this.gameIsOver = false;
        this.segundos   = data?.segundos ?? 0;

        // ── Mapa ─────────────────────────────────────────────
        try {
            this.map      = this.make.tilemap({ key: 'map_boss' });
            const tileset = this.map.addTilesetImage('tipe', 'tiles_boss');
            this.groundLayer = this.map.createLayer('ground', tileset, 0, 0);
            this.wallsLayer  = this.map.createLayer('walls',  tileset, 0, 0);
            this.wallsLayer.setCollisionByExclusion([0, -1]);
        } catch(e) {
            this.add.rectangle(0, 0, 432, 324, 0x111111).setOrigin(0);
            this.wallsLayer = null;
        }

        this.physics.world.setBounds(0, 0,
            this.map?.widthInPixels  ?? 432,
            this.map?.heightInPixels ?? 324
        );

        // Mejora la detección de colisiones con tiles para velocidades altas
        this.physics.world.TILE_BIAS = 32;

        this._crearAnimaciones();

        // ── Controles ─────────────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

        // ── Teclas de debug ───────────────────────────────────
        this.keyF1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
        this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
        this.keyF4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F4);
        this.keyF5 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5);

        // ── Jugador ───────────────────────────────────────────
        const spawn   = data?.playerSpawn ?? { x: 216, y: 270 };
        this.player   = new Player(this, spawn.x, spawn.y);
        this.player.lastDamageTime = 0;
        if (data?.playerHP !== undefined) this.player.vida = data.playerHP;

        // ── Grupos ────────────────────────────────────────────
        this.bossBullets   = this.physics.add.group();
        this.bossEnemies   = this.physics.add.group();
        this.fireControllers = [];

        // ── On-fire visual ────────────────────────────────────
        this._onFireImg = this.add.image(0, 0, 'mantle_imonfire_0')
            .setScale(2).setTint(0xff0000).setVisible(false);

        // ── Boss ──────────────────────────────────────────────
        this.boss = new ShadowMantle(this, 216, 80);

        // ── Sonidos ───────────────────────────────────────────
        this.attackSound = this.sound.add('snd_sword',      { volume: 0.5 });
        this.hitSound    = this.sound.add('player_hit');
        this.bossHitSound= this.sound.add('snd_board_bosshit', { volume: 0.8 });

        // ── Música ────────────────────────────────────────────
        this.sound.getAll().forEach(s => { if (s.isPlaying) s.stop(); });
        this.music = this.sound.add('nightmare_boss', { loop: true, volume: 0.6 });
        this.music.play();

        // ── Cámara ────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0,
            this.map?.widthInPixels  ?? 432,
            this.map?.heightInPixels ?? 324
        );

        // ── HUD ───────────────────────────────────────────────
        this._crearBossHUD();

        // ── Colisiones ────────────────────────────────────────
        this._crearColisiones();

        this.events.on('boss-onfire', ({ active, x, y }) => {
            this._onFireImg.setVisible(active);
            if (active) this._onFireImg.setPosition(x, y - 16);
        });

        this.events.on('boss-defeated', () => this._bossDefeated());
        this.events.on('boss-phase-transition', () => {
            this.cameras.main.flash(500, 100, 0, 100);
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);

        this._flamePathAngle = 0;
    }

    // ─────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────
    update(time, delta) {
        if (this.gameIsOver) return;

        this.player.update(this.cursors);

        const b = this.boss;
        if (Phaser.Input.Keyboard.JustDown(this.keyF1)) this._debugForcePhase(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyF2)) this._debugForcePhase(2);
        if (Phaser.Input.Keyboard.JustDown(this.keyF3)) this._debugForcePhase(3);
        if (Phaser.Input.Keyboard.JustDown(this.keyF4)) this._debugForcePhase(4);
        if (Phaser.Input.Keyboard.JustDown(this.keyF5)) {
            console.log(`[DEBUG] hp:${b.hp.toFixed(1)} phase:${b.phase} dashcon:${b.dashcon} burstwavecon:${b.burstwavecon} flamewavecon:${b.flamewavecon} spawnenemies:${b.spawnenemies} phasetransitioncon:${b.phasetransitioncon} attacktimer:${b.attacktimer} movestyle:${b.movestyle}`);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.player.attack();
        }

        this.boss.actualizar(delta);

        [...this.fireControllers].forEach(fc => fc.actualizar(delta));

        this.bossBullets.getChildren().forEach(b => {
            if (b.actualizar) b.actualizar(delta);
        });

        this.bossEnemies.getChildren().forEach(e => {
            if (e.actualizar) e.actualizar(delta);
        });

        // ── Comprobación manual: ataque del jugador vs enemies ─
        // Se hace aquí (no solo por overlap de Phaser) para cubrir
        // el caso en que el jugador esté DENTRO del enemigo y el
        // attackHitbox no solape por estar posicionado delante.
        if (this.player.isAttacking) {
            this._checkSwordVsEnemies();
        }

        if (this.boss.movestyle === 'path') {
            this._flamePathAngle += 0.5;
            const cx = this.physics.world.bounds.width  / 2;
            const cy = this.physics.world.bounds.height / 2;
            this.boss.setPathTarget(
                cx + Math.cos(Phaser.Math.DegToRad(this._flamePathAngle)) * 100,
                cy + Math.sin(Phaser.Math.DegToRad(this._flamePathAngle)) * 60
            );
        }

        this._actualizarBossHUD();
    }

    // ─────────────────────────────────────────────────────────
    // ATAQUE DE ESPADA VS ENEMIES — comprobación manual
    // Cubre tanto el attackHitbox delante del jugador como
    // el propio cuerpo del jugador, para que funcione aunque
    // esté dentro del enemigo.
    // ─────────────────────────────────────────────────────────
    _checkSwordVsEnemies() {
        // Zona de detección: unión del attackHitbox + el cuerpo del jugador
        const player = this.player;

        // Bounds del hitbox de ataque (ya posicionado delante)
        const hb = player.attackHitbox;
        const hbBounds = new Phaser.Geom.Rectangle(
            hb.x - hb.width  / 2,
            hb.y - hb.height / 2,
            hb.width,
            hb.height
        );

        // Bounds del propio jugador (para cuando está dentro del enemy)
        const pBounds = player.getBounds();

        this.bossEnemies.getChildren().forEach(enemy => {
            if (!enemy.activeHitbox || enemy.isDead) return;
            if (enemy._hurttimer > 0) return; // ya recibió golpe, en iframes

            const eBounds = enemy.getBounds();

            const hitByHitbox = Phaser.Geom.Intersects.RectangleToRectangle(hbBounds, eBounds);
            const hitByBody   = Phaser.Geom.Intersects.RectangleToRectangle(pBounds,  eBounds);

            if (hitByHitbox || hitByBody) {
                if (enemy.takeHit) {
                    enemy.takeHit(this._dirToIndex(player.lastDir));
                    this.bossHitSound.play();
                    this.boss.hitsduringenemies++;
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────
    // KNOCKBACK — respeta colisiones con paredes
    // ─────────────────────────────────────────────────────────
    _applyKnockback(player, sourceX, sourceY) {
        const KNOCKBACK_SPEED    = 280;
        const KNOCKBACK_DURATION = 150;

        let dx = player.x - sourceX;
        let dy = player.y - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= dist;
        dy /= dist;

        player.isKnockedBack = true;
        player.setVelocity(dx * KNOCKBACK_SPEED, dy * KNOCKBACK_SPEED);

        this.time.delayedCall(KNOCKBACK_DURATION, () => {
            if (player?.body) {
                player.setVelocity(0, 0);
                player.isKnockedBack = false;
            }
        });
    }

    // ─────────────────────────────────────────────────────────
    // COLISIONES
    // ─────────────────────────────────────────────────────────
    _crearColisiones() {
        if (this.wallsLayer) {
            this.physics.add.collider(this.player, this.wallsLayer);
        }

        // Jugador ← proyectiles del boss
        this.physics.add.overlap(this.player, this.bossBullets, (player, bullet) => {
            const hasActiveHitbox =
                bullet.activeHitbox !== undefined ? bullet.activeHitbox : true;
            if (!hasActiveHitbox) return;

            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(bullet.damage ?? 2);
                player.lastDamageTime = ahora;
                this.hitSound.play();
                this._applyKnockback(player, bullet.x, bullet.y);
            }

            if (bullet.destroyonhit ?? true) {
                bullet.destroy();
            } else if (bullet.onHit) {
                bullet.onHit();
            }
        });

        // Jugador ← contacto con boss
        this.physics.add.overlap(this.player, this.boss, (player, boss) => {
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(2);
                player.lastDamageTime = ahora;
                this.hitSound.play();
                this._applyKnockback(player, boss.x, boss.y);
            }
        });

        // Jugador ← enemigos spawneados
        this.physics.add.overlap(this.player, this.bossEnemies, (player, enemy) => {
            if (!enemy.activeHitbox) return;
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(enemy.damage ?? 2);
                player.lastDamageTime = ahora;
                this.hitSound.play();
                this._applyKnockback(player, enemy.x, enemy.y);
            }
        });

        // Ataque del jugador → boss
        this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
            if (this.player.isAttacking) {
                this.boss.takeDamage();
                this.bossHitSound.play();
            }
        });

        // Ataque del jugador → enemies (overlap de Phaser como respaldo)
        // La comprobación principal es _checkSwordVsEnemies() en update()
        this.physics.add.overlap(this.player.attackHitbox, this.bossEnemies, (hitbox, enemy) => {
            if (!this.player.isAttacking) return;
            if (!enemy.activeHitbox || enemy.isDead) return;
            if (enemy._hurttimer > 0) return;
            if (enemy.takeHit) {
                enemy.takeHit(this._dirToIndex(this.player.lastDir));
                this.bossHitSound.play();
                this.boss.hitsduringenemies++;
            }
        });
    }

    _dirToIndex(dir) {
        return { down: 0, right: 1, up: 2, left: 3 }[dir] ?? 0;
    }

    // ─────────────────────────────────────────────────────────
    // HUD — Barra de vida del boss
    // ─────────────────────────────────────────────────────────
    _crearBossHUD() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this._bossHUDBar = this.add.graphics().setScrollFactor(0).setDepth(20);
        this._bossName   = this.add.text(W / 2, H - 40, 'SHADOW MANTLE', {
            fontFamily : 'UndertaleFont',
            fontSize   : '14px',
            fill       : '#ffffff',
            align      : 'center',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setResolution(10);
    }

    _actualizarBossHUD() {
        if (!this.boss || this.boss.isDead) return;
        const W    = this.cameras.main.width;
        const H    = this.cameras.main.height;
        const barW = 200;
        const barH = 8;
        const barX = (W - barW) / 2;
        const barY = H - 28;
        const pct  = Math.max(0, this.boss.hp / this.boss.hp_max);

        this._bossHUDBar.clear();
        this._bossHUDBar.fillStyle(0x333333);
        this._bossHUDBar.fillRect(barX, barY, barW, barH);
        this._bossHUDBar.fillStyle(0xaa00ff);
        this._bossHUDBar.fillRect(barX, barY, barW * pct, barH);
        this._bossHUDBar.lineStyle(1, 0xffffff);
        this._bossHUDBar.strokeRect(barX, barY, barW, barH);
    }

    // ─────────────────────────────────────────────────────────
    // ANIMACIONES
    // ─────────────────────────────────────────────────────────
    _crearAnimaciones() {
        const makeAnim = (key, frames, fps = 6, repeat = -1) => {
            if (this.anims.exists(key)) return;
            this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: fps, repeat });
        };

        makeAnim('walk-down',  ['down0',  'down1']);
        makeAnim('walk-up',    ['up0',    'up1']);
        makeAnim('walk-left',  ['left0',  'left1']);
        makeAnim('walk-right', ['right0', 'right1']);
        ['down', 'up', 'left', 'right'].forEach(d =>
            makeAnim(`attack-${d}`, [`${d}Attack0`, `${d}Attack1`, `${d}Attack2`], 10, 0)
        );

        makeAnim('mantle-idle',
            Array.from({length:6}, (_,i) => `mantle_idle_${i}`), 20);
        makeAnim('mantle-dash',
            ['mantle_dash_0', 'mantle_dash_1'], 30);
        makeAnim('mantle-onfire',
            ['mantle_onfire_0', 'mantle_onfire_1'], 30);
        makeAnim('mantle-release',
            Array.from({length:10}, (_,i) => `mantle_release_${i}`), 30, 0);
        makeAnim('mantle-release-abbreviated',
            Array.from({length:5},  (_,i) => `mantle_release_abbreviated_${i}`), 30, 0);
        makeAnim('mantle-laugh',
            ['mantle_laugh_0', 'mantle_laugh_1'], 6);
        makeAnim('mantle-side-r',
            Array.from({length:3}, (_,i) => `mantle_side_r_${i}`), 20);
        makeAnim('mantle-side-l',
            Array.from({length:3}, (_,i) => `mantle_side_l_${i}`), 20);
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────
    destroyFireControllers() {
        this.fireControllers.forEach(fc => {
            fc.isDead = true;
            if (fc._fires) fc._fires.forEach(f => { if (!f.isDead) f.destroy(); });
        });
        this.fireControllers = [];
    }

    // ─────────────────────────────────────────────────────────
    // BOSS DERROTADO
    // ─────────────────────────────────────────────────────────
    _bossDefeated() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;

        this.music.stop();
        this.cameras.main.flash(1000, 255, 255, 255);
        this.cameras.main.fadeOut(2000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('SaveScene', {
                callerScene : 'BossScene',
                segundos    : this.segundos,
                playerHP    : this.player.vida,
                roomName    : 'Campo Nevado',
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // MUERTE DEL JUGADOR
    // ─────────────────────────────────────────────────────────
    playerDied() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;
        this.music.stop();
        this.registry.set('lastRoom', 'BossScene');
        this.scene.start('GameOverScene', { x: this.player.x, y: this.player.y });
    }

    // ─────────────────────────────────────────────────────────
    // DEBUG — forzar fase (F1-F4) / imprimir estado (F5)
    // ─────────────────────────────────────────────────────────
    _debugForcePhase(phase) {
        const b = this.boss;

        b.burstwavecon = 0; b.burstwavetimer = 0;
        b.spawnenemies = 0; b.spawnenemiestimer = 0;
        b.dashcon      = 0; b.dashtimer = 0;
        b.flamewavecon = 0; b.flamewavetimer = 0;
        b.phasetransitioncon = 0; b.phasetransitiontimer = 0;
        b.telegraphtimer = 0;
        b._vx = 0; b._vy = 0;
        b._dashSpeed = 0; b._dashGravityAmt = 0; b._dashFriction = 0;
        b._dashPrepared = false;
        b.ohmygodimonfire = 0;
        b.movestyle = 'none';
        b.movecon = 0; b.movetimer = 0;
        b.dashcount = 0; b.dashused = 0;
        b.burstwaveused = 0; b.flamewaveused = 0;
        b.enemywaveused = 0;
        this.destroyFireControllers();
        this.bossBullets.clear(true, true);
        this.bossEnemies.clear(true, true);

        const hpMap = { 1: 28, 2: 18, 3: 9, 4: 3 };
        b.hp    = hpMap[phase];
        b.phase = phase - 1;
        b.attacktimer = 20;
        b._playAnim('mantle-idle');

        console.log(`[DEBUG] Forzando fase ${phase} — hp: ${b.hp}`);
    }
}