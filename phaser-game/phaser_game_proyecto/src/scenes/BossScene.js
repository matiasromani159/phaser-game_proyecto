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
import GameState                             from '../GameState.js';
import DialogueSystem                        from '../scenes/DialogueSystem.js';

export default class BossScene extends Phaser.Scene {

    constructor() { super({ key: 'BossScene' }); }

    // ─────────────────────────────────────────────────────────
    // PRELOAD
    // ─────────────────────────────────────────────────────────
    preload() {
        this.load.image('tiles_boss',         '/src/assets/tiles/tipe.png');
        this.load.tilemapTiledJSON('map_boss', '/src/assets/tiles/boss_room.json');

        this.load.audio('nightmare_boss', '/src/assets/sounds/nightmare_boss_heavy.ogg');
        this.load.audio('nightmare_nes',  '/src/assets/sounds/nightmare_nes.ogg');
        this.load.audio('player_hit',     '/src/assets/sounds/snd_hurt.wav');
        this.load.audio('snd_sword',      '/src/assets/sounds/snd_sword.wav');
        this.load.image('healthbar',      '/src/assets/sprites/spr_hp_bar.png');
        this.load.image('spr_board_candy','/src/assets/sprites/spr_board_candy.png');
        this.load.audio('snd_power',      '/src/assets/sounds/snd_power.wav');

        // Sonidos del DialogueSystem
        this.load.audio('snd_board_text_main',     '/src/assets/sounds/snd_board_text_main.wav');
        this.load.audio('snd_board_text_main_end', '/src/assets/sounds/snd_board_text_main_end.wav');
        this.load.audio('snd_board_lift',          '/src/assets/sounds/snd_board_lift.wav');

        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach(dir => {
            for (let i = 0; i < 2; i++)
                this.load.image(`${dir}${i}`, `/src/assets/sprites/spr_kris_${dir}/spr_kris_${i}.png`);
            for (let i = 0; i < 3; i++)
                this.load.image(`${dir}Attack${i}`, `/src/assets/sprites/spr_kris_attack_${dir}/spr_kris_${i}.png`);
        });

        const bossSprites = {
            'mantle_idle':                { path: 'spr_shadow_mantle_idle',                frames: 6  },
            'mantle_dash':                { path: 'spr_shadow_mantle_dash',                frames: 2  },
            'mantle_onfire':              { path: 'spr_shadow_mantle_onfire',              frames: 2  },
            'mantle_release':             { path: 'spr_shadow_mantle_release',             frames: 10 },
            'mantle_release_abbreviated': { path: 'spr_shadow_mantle_release_abbreviated', frames: 5  },
            'mantle_laugh':               { path: 'spr_shadow_mantle_laugh',               frames: 2  },
            'mantle_side_r':              { path: 'spr_shadow_mantle_side_r',              frames: 3  },
            'mantle_side_l':              { path: 'spr_shadow_mantle_side_l',              frames: 3  },
            'mantle_fire':                { path: 'spr_shadow_mantle_fire',                frames: 3  },
            'mantle_fire2':               { path: 'spr_shadow_mantle_fire2',               frames: 3  },
            'mantle_imonfire':            { path: 'spr_board_imonfire',                    frames: 2  },
        };
        Object.entries(bossSprites).forEach(([key, { path, frames }]) => {
            for (let i = 0; i < frames; i++)
                this.load.image(`${key}_${i}`, `/src/assets/sprites/spr_boss/${path}/${path}_${i}.png`);
        });

        this.load.image('mantle_bomb_0',        '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_bomb_shadow',    '/src/assets/sprites/spr_smallbullet_outline.png');
        this.load.image('mantle_cloud_0',        '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_1',        '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_2',        '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_3',        '/src/assets/sprites/spr_smallbullet.png');
        this.load.image('mantle_cloud_bullet_0', '/src/assets/sprites/spr_smallbullet.png');
        for (let i = 0; i < 2; i++)
            this.load.image(`mantle_cloud_projectile_${i}`,
                `/src/assets/sprites/spr_boss/spr_shadow_mantle_cloud_projectile/spr_shadow_mantle_cloud_projectile_${i}.png`);

        this.load.image('enemy_hurt', '/src/assets/sprites/spr_boss/spr___hurt.png');
        for (let i = 0; i < 10; i++)
            this.load.image(`enemy_laugh_${i}`,   `/src/assets/sprites/spr_boss/spr___laugh/spr___laugh_${i}.png`);
        for (let i = 0; i < 5; i++)
            this.load.image(`enemy_appear_${i}`,  `/src/assets/sprites/spr_boss/spr___appear/spr___appear_${i}.png`);
        for (let i = 0; i < 4; i++)
            this.load.image(`enemy_walk_${i}`,    `/src/assets/sprites/spr_boss/spr___/spr____${i}.png`);

        this.load.audio('snd_board_bosshit',          '/src/assets/sounds/snd_boss/snd_board_bosshit.wav');
        this.load.audio('snd_board_mantle_laugh_mid', '/src/assets/sounds/snd_boss/snd_board_mantle_laugh_mid.wav');
        this.load.audio('snd_board_mantle_dash_slow', '/src/assets/sounds/snd_boss/snd_board_mantle_dash_slow.wav');
        this.load.audio('snd_board_mantle_dash_fast', '/src/assets/sounds/snd_boss/snd_board_mantle_dash_fast.wav');
        this.load.audio('snd_board_throw',            '/src/assets/sounds/snd_boss/snd_board_throw.wav');
        this.load.audio('snd_bump',                   '/src/assets/sounds/snd_boss/snd_bump.wav');
        this.load.audio('snd_board_bomb',             '/src/assets/sounds/snd_boss/snd_board_bomb.wav');
        this.load.audio('snd_board_summon',           '/src/assets/sounds/snd_boss/snd_board_summon.wav');
        this.load.audio('snd_board_torch',            '/src/assets/sounds/snd_boss/snd_board_torch.wav');
        this.load.audio('snd_board_torch_high',       '/src/assets/sounds/snd_boss/snd_board_torch_high.wav');
        this.load.audio('snd_board_mantle_move',      '/src/assets/sounds/snd_boss/snd_board_mantle_move.wav');
        this.load.audio('snd_wing',                   '/src/assets/sounds/snd_boss/snd_wing.wav');

        for (let i = 0; i < 6; i++)
            this.load.image(`savepoint_${i}`, `/src/assets/sprites/spr_savepoint/spr_savepoint_${i}.png`);
    }

    // ─────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────
    create(data) {
        this.gameIsOver = false;
        this.segundos   = data?.segundos ?? 0;

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
        this.physics.world.TILE_BIAS = 32;

        this._crearAnimaciones();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyF1   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
        this.keyF2   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.keyF3   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
        this.keyF4   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F4);
        this.keyF5   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5);

        const spawn = data?.playerSpawn ?? { x: 216, y: 270 };
        this.player = new Player(this, spawn.x, spawn.y);
        this.player.lastDamageTime = 0;

        this.bossBullets     = this.physics.add.group();
        this.bossEnemies     = this.physics.add.group();
        this.fireControllers = [];

        this._onFireImg = this.add.image(0, 0, 'mantle_imonfire_0')
            .setScale(2).setTint(0xff0000).setVisible(false);

        this.boss = new ShadowMantle(this, 216, 80);

        this.attackSound  = this.sound.add('snd_sword',         { volume: 0.5 });
        this.hitSound     = this.sound.add('player_hit');
        this.bossHitSound = this.sound.add('snd_board_bosshit', { volume: 0.8 });

        this.sound.getAll().forEach(s => { if (s.isPlaying) s.stop(); });
        this.music    = this.sound.add('nightmare_boss', { loop: true, volume: 0.6 });
        this.musicNes = this.sound.add('nightmare_nes',  { loop: true, volume: 0.6 });

        this.cameras.main.setBounds(0, 0,
            this.map?.widthInPixels  ?? 432,
            this.map?.heightInPixels ?? 324
        );

        this._crearBossHUD();
        this._crearColisiones();

        this.dialogue = new DialogueSystem(this, { fontSize: 16, fontFamily: 'TennaGlyphs' });

        this.events.on('boss-onfire', ({ active, x, y }) => {
            this._onFireImg.setVisible(active);
            if (active) this._onFireImg.setPosition(x, y - 16);
        });

        this.events.on('boss-defeated', () => this._iniciarOutro());
        this.events.on('boss-phase-transition', ({ phase }) => {
            this.cameras.main.flash(500, 100, 0, 100);
            this._iniciarTransicionFase(phase);
        });

        this._phaseColors = [0xA85854, 0x9A6E6A, 0x8A6488, 0xB04020];
        this._crearOverlayGrid();

        this.events.on('boss-transition-particle', ({ x, y }) => {
            const particle = this.add.image(x, y, 'mantle_fire_0')
                .setScale(1.5).setTint(0xff6600);
            this.tweens.add({
                targets: particle, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 300,
                onComplete: () => particle.destroy()
            });
        });

        this.events.on('enemy-drop-candy', ({ x, y }) => {
            const TILE = 36;
            const _findFreeTile = (ox, oy) => {
                const col0 = Math.floor(ox / TILE), row0 = Math.floor(oy / TILE);
                for (let r = 0; r <= 4; r++) {
                    for (let dc = -r; dc <= r; dc++) {
                        for (let dr = -r; dr <= r; dr++) {
                            if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
                            const col = col0 + dc, row = row0 + dr;
                            const wall = this.wallsLayer?.getTileAt(col, row);
                            if (wall && wall.collides) continue;
                            return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
                        }
                    }
                }
                return { x: col0 * TILE + TILE / 2, y: row0 * TILE + TILE / 2 };
            };
            const { x: sx, y: sy } = _findFreeTile(x, y);
            const candy = this.physics.add.sprite(sx, sy, 'spr_board_candy');
            candy.body.allowGravity = false;
            candy.body.setImmovable(true);
            candy.setScale(2).setTint(0x00ff88);
            const blinkTimer = this.time.delayedCall(4000, () => {
                if (!candy.active) return;
                this.tweens.add({
                    targets: candy, alpha: 0, duration: 200, ease: 'Linear', yoyo: true, repeat: 9,
                    onComplete: () => { if (candy.active) candy.destroy(); }
                });
            });
            const killTimer = this.time.delayedCall(8000, () => { if (candy.active) candy.destroy(); });
            const overlap = this.physics.add.overlap(this.player, candy, () => {
                if (!this.player || this.player.isDead || !candy.active) return;
                this.player.vida = Math.min(this.player.vidaMax, this.player.vida + 10);
                GameState.playerHP = this.player.vida;
                this.player.drawHealthBar();
                this.sound.play('snd_power', { volume: 0.7 });
                blinkTimer.remove(); killTimer.remove();
                this.physics.world.removeCollider(overlap);
                candy.destroy();
            });
        });

        this._flamePathAngle = 0;
        this._iniciarIntro();
    }

    // ─────────────────────────────────────────────────────────
    // INTRO
    // ─────────────────────────────────────────────────────────
    _iniciarIntro() {
        this._introActiva   = true;
        this._introLen      = 200;
        this._introDir      = 0;
        this._introSiner    = 0;
        this._introFase     = 'orbit';
        this._introTimer    = 0;
        this._introCon      = 0;
        this._introFrameIdx = 0;
        this._introFrameAcc = 0;
        this._introLaughing = false; // ← bloquea el idle mientras dura la risa

        const BOSS_SCALE = 1.125;

        this.boss.setVisible(false);
        this.boss.body.enable = false;

        this.player.setActive(false).setVisible(true);  // visible pero sin control
        this.player.anims.stop();
        this.player.setVelocity(0, 0);

        this._introImg = this.add.image(this.boss.x, this.boss.y, 'mantle_idle_0')
            .setScale(BOSS_SCALE).setDepth(10);

        this._introGhosts = Array.from({ length: 8 }, () =>
            this.add.image(this.boss.x, this.boss.y, 'mantle_idle_0')
                .setScale(BOSS_SCALE).setAlpha(0.6).setDepth(9).setVisible(false)
        );

        this.sound.play('snd_board_mantle_move', { volume: 0.8 });
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // ── FIX 1: Ocultar HUD del jugador durante la intro ──
        this.player.barra.setVisible(false);
        this.player.healthBarSprite.setVisible(false);
    }

    _tickIntro() {
        if (!this._introActiva) return;

        this._introFrameAcc += 0.125;
        if (this._introFrameAcc >= 1) {
            this._introFrameAcc -= 1;
            this._introFrameIdx = (this._introFrameIdx + 1) % 6;
        }
        const frameKey = `mantle_idle_${this._introFrameIdx}`;
        const bx = this.boss.x;
        const by = this.boss.y;

        // ── Fase ORBIT ────────────────────────────────────────
        if (this._introFase === 'orbit') {
            this._introCon = this._introCon === 0 ? 1 : 0;
            this._introDir += 5;

            if (this._introCon === 0) {
                for (let i = 0; i < 8; i++) {
                    const angle = Phaser.Math.DegToRad(i * 45 + this._introDir);
                    const gx = Math.round((bx + Math.cos(angle) * this._introLen) / 2) * 2;
                    const gy = Math.round((by + Math.sin(angle) * this._introLen) / 2) * 2;
                    this._introGhosts[i].setPosition(gx, gy).setTexture(frameKey).setVisible(true);
                }
            } else {
                this._introGhosts.forEach(g => g.setVisible(false));
            }

            this._introImg.setTexture(frameKey).setPosition(
                Math.round(bx / 2) * 2,
                Math.round(by / 2) * 2
            );

            this._introLen -= 6;

            if (this._introLen < 2) {
                this._introGhosts.forEach(g => g.setVisible(false));
                this._introFase  = 'float';
                this._introTimer = 0;
                this._playIntroLaugh();
            }

        // ── Fase FLOAT ────────────────────────────────────────
        } else if (this._introFase === 'float') {
            this._introSiner++;
            const fy = Math.round((by + Math.sin(this._introSiner / 8) * 4) / 2) * 2;

            // FIX 2: solo actualizar textura idle si NO está riendo
            if (!this._introLaughing) {
                this._introImg.setTexture(frameKey);
            }
            this._introImg.setPosition(Math.round(bx / 2) * 2, fy);

            this._introTimer++;
            if (this._introTimer > 80) {
                this._introFase = 'done';
                this._finalizarIntro();
            }
        }
    }

    // FIX 3: flag _introLaughing para que el tick no sobreescriba el sprite
    _playIntroLaugh() {
        this.sound.play('snd_board_mantle_laugh_mid', { detune: 500 });
        this._introLaughing = true;

        let laughFrame = 0, laughAcc = 0, laughSpeed = 0.6, elapsed = 0;
        const t = this.time.addEvent({
            delay: 16, repeat: 200,
            callback: () => {
                elapsed++;
                if (elapsed <= 49)
                    laughSpeed = Phaser.Math.Linear(0.6, 0.1, elapsed / 49);
                laughAcc += laughSpeed * 0.5;
                if (laughAcc >= 1) { laughAcc -= 1; laughFrame = (laughFrame + 1) % 2; }
                this._introImg?.setTexture(`mantle_laugh_${laughFrame}`);
                if (elapsed >= 50) {
                    t.remove();
                    this._introLaughing = false; // volver al idle
                }
            }
        });
    }

    _finalizarIntro() {
        this._introImg.destroy();
        this._introGhosts.forEach(g => g.destroy());

        this.boss.setScale(1.125);
        this.boss.setVisible(true);
        this.boss.body.enable = true;

        this.player.setActive(true).setVisible(true);

        // ── FIX 1: Restaurar HUD del jugador al terminar la intro
        this.player.barra.setVisible(true);
        this.player.healthBarSprite.setVisible(true);

        this.music.play();
        this._introActiva = false;
    }

    // ─────────────────────────────────────────────────────────
    // OUTRO
    // ─────────────────────────────────────────────────────────
    _iniciarOutro() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;

        this.music.stop();
        this.bossBullets.clear(true, true);
        this.bossEnemies.clear(true, true);
        this.destroyFireControllers();

        this.player.setActive(false);
        this.player.anims.stop();
        this.player.setVelocity(0, 0);
        this.player._setIdleTexture(this.player.lastDir);

        this.boss.setVisible(true);
        this.boss.setAlpha(1);
        this.boss.clearTint();
        this.boss.body.enable = false;
        this.boss.setVelocity(0, 0);

        this._outroTimer    = 0;
        this._outroSiner    = 0;
        this._outroHurt     = 8;
        this._outroActivo   = true;
        this._outroFase     = 0;
        this._outroVY       = 0;
        this._outroDialogos = false;
    }

    _tickOutro() {
        if (!this._outroActivo || !this.boss) return;

        if (this.dialogue.isActive) {
            this.dialogue.update();
            return;
        }

        this._outroTimer++;
        this._outroSiner++;
        const t = this._outroTimer;

        if (this._outroFase < 10) {
            this.boss.y = this.boss.y + Math.sin(this._outroSiner / 8) * 0.3;
        }

        const hitVols = { 1: 1.0, 12: 0.6, 24: 0.3, 36: 0.1, 48: 0.05 };
        if (hitVols[t] !== undefined)
            this.bossHitSound.play({ volume: hitVols[t], detune: -100 });

        if (t < 25)   this.boss.setAlpha(this.boss.alpha === 1 ? 0 : 1);
        if (t === 25) this.boss.setAlpha(1);

        if (t > 54 && t < 64) {
            const p = (t - 54) / 10;
            this.boss.x = Phaser.Math.Linear(this.boss.x, 216, p);
            this.boss.y = Phaser.Math.Linear(this.boss.y, 120, p);
        }

        if (t === 104 || t === 134 || t === 164) {
            this.bossHitSound.play({ volume: 0.8 });
            this.cameras.main.flash(80, 255, 255, 255);
            this._outroHurt       = 16;
            this._outroFlashPhase = (this._outroFlashPhase ?? 0) + 1;

            const phaseIdx  = Math.max(3 - this._outroFlashPhase, 0);
            const tileColor = this._phaseColors[phaseIdx];
            const COLS = 12, ROWS = 9;
            for (let col = 0; col < COLS; col++)
                for (let row = 0; row < ROWS; row++)
                    this._tintTile(col, row, tileColor);
        }

        if (this._outroHurt > 0) {
            this._outroHurt--;
            const phaseIdx    = Math.max(3 - (this._outroFlashPhase ?? 1), 0);
            const revertColor = this._phaseColors[phaseIdx];
            if ((this._outroHurt % 2) === 0) this.boss.setTint(0xffffff);
            else                             this.boss.setTint(revertColor);
            if (this._outroHurt === 0) {
                this.boss.setTint(revertColor);
                this.tweens.addCounter({
                    from: 0, to: 100, duration: 500,
                    onUpdate: (tween) => {
                        if (!this.boss?.active) return;
                        const v  = tween.getValue() / 100;
                        const r1 = (revertColor >> 16) & 0xff;
                        const g1 = (revertColor >> 8)  & 0xff;
                        const b1 =  revertColor        & 0xff;
                        const r  = Math.round(Phaser.Math.Linear(r1, 0xff, v));
                        const g  = Math.round(Phaser.Math.Linear(g1, 0xff, v));
                        const b  = Math.round(Phaser.Math.Linear(b1, 0xff, v));
                        this.boss.setTint((r << 16) | (g << 8) | b);
                    },
                    onComplete: () => { if (this.boss?.active) this.boss.clearTint(); }
                });
            }
        }

        if (t === 172) {
            this.music.stop();
            this.musicNes.play();
        }

        if (t === 242 && !this._outroDialogos) {
            this._outroDialogos = true;
            this._mostrarDialogosOutro();
        }

        if (this._outroFase === 10) {
            this._outroVY -= 0.15;
            this.boss.y  += this._outroVY;

            if (this._outroTimer % 5 === 0) {
                const ghost = this.add.image(this.boss.x, this.boss.y, 'mantle_idle_0')
                    .setScale(1.125).setAlpha(0.5).setDepth(this.boss.depth - 1);
                this.tweens.add({
                    targets: ghost, alpha: 0, duration: 400,
                    onComplete: () => ghost.destroy()
                });
            }

            if (this.boss.y < -32) {
                this._outroActivo = false;
                this._finalizarOutro();
            }
        }
    }

    _mostrarDialogosOutro() {
        this.dialogue.show([
            "Eso! That's what I wanted to see!/",
            "Flickering red, like pretty little flames.../",
            "Your eyes can't hide it, Kris. Without play.../",
            "The knife grows dull./",
            "Haha.. well, enough of that! We both have work to do!/",
        ], () => {
            this.dialogue.show([
                "So if you want this MANTLE, hurry up and take it.../",
                "If you can reach it!/%",
            ], () => {
                this.time.delayedCall(300, () => {
                    this.sound.play('snd_wing', { volume: 0.8 });
                    this._outroFase = 10;
                });
            });
        });
    }

    _finalizarOutro() {
        if (this.boss?.active) this.boss.destroy();
        if (this.musicNes?.isPlaying) this.musicNes.stop();
        this.cameras.main.fadeOut(1500, 0, 0, 0);
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
    // UPDATE
    // ─────────────────────────────────────────────────────────
    update(time, delta) {
        if (this._introActiva) {
            this._tickIntro();
            return;
        }

        if (this._outroActivo) {
            this._tickOutro();
            return;
        }

        if (this.gameIsOver) return;

        this.player.update(this.cursors);

        const b = this.boss;
        if (Phaser.Input.Keyboard.JustDown(this.keyF1)) this._debugForcePhase(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyF2)) this._debugForcePhase(2);
        if (Phaser.Input.Keyboard.JustDown(this.keyF3)) this._debugForcePhase(3);
        if (Phaser.Input.Keyboard.JustDown(this.keyF4)) this._debugForcePhase(4);
        if (Phaser.Input.Keyboard.JustDown(this.keyF5)) {
            console.log(`[DEBUG] hp:${b.hp.toFixed(1)} phase:${b.phase} dashcon:${b.dashcon} burstwavecon:${b.burstwavecon} flamewavecon:${b.flamewavecon} spawnenemies:${b.spawnenemies} phasetransitioncon:${b.phasetransitioncon} attacktimer:${b.attacktimer} movestyle:${b.movestyle} hitsduringenemies:${b.hitsduringenemies}`);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) this.player.attack();

        this.boss.actualizar(delta);
        [...this.fireControllers].forEach(fc => fc.actualizar(delta));
        this.bossBullets.getChildren().forEach(b => { if (b.actualizar) b.actualizar(delta); });
        this.bossEnemies.getChildren().forEach(e => { if (e.actualizar) e.actualizar(delta); });

        if (this.player.isAttacking) this._checkSwordVsEnemies();

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
    // ATAQUE DE ESPADA VS ENEMIES
    // ─────────────────────────────────────────────────────────
    _checkSwordVsEnemies() {
        const player = this.player;
        const hb = player.attackHitbox;
        const hbBounds = new Phaser.Geom.Rectangle(hb.body.x, hb.body.y, hb.body.width, hb.body.height);
        const pb = player.body;
        const pBounds  = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);

        this.bossEnemies.getChildren().forEach(enemy => {
            if (!enemy.activeHitbox || enemy.isDead || enemy._hurttimer > 0) return;
            const eb = enemy.body;
            const eBounds = new Phaser.Geom.Rectangle(eb.x, eb.y, eb.width, eb.height);
            if (Phaser.Geom.Intersects.RectangleToRectangle(hbBounds, eBounds) ||
                Phaser.Geom.Intersects.RectangleToRectangle(pBounds,  eBounds)) {
                if (enemy.takeHit) {
                    enemy.takeHit(this._dirToIndex(player.lastDir));
                    this.bossHitSound.play();
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────
    // KNOCKBACK
    // ─────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────
    // COLISIONES
    // ─────────────────────────────────────────────────────────
    _crearColisiones() {
        if (this.wallsLayer) {
            this.physics.add.collider(this.player,      this.wallsLayer);
            this.physics.add.collider(this.bossEnemies, this.wallsLayer);
        }

        this.physics.add.overlap(this.player, this.bossBullets, (player, bullet) => {
            if (this._introActiva || this._outroActivo) return;
            const hasActiveHitbox = bullet.activeHitbox !== undefined ? bullet.activeHitbox : true;
            if (!hasActiveHitbox) return;
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(bullet.damage ?? 2);
                player.lastDamageTime = ahora;
                this.hitSound.play();
                this._applyKnockback(player, bullet.x, bullet.y);
            }
            if (bullet.destroyonhit ?? true) bullet.destroy();
            else if (bullet.onHit) bullet.onHit();
        });

        this.physics.add.overlap(this.player, this.boss, (player, boss) => {
            if (this._introActiva || this._outroActivo) return;
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(2);
                player.lastDamageTime = ahora;
                this.hitSound.play();
                this._applyKnockback(player, boss.x, boss.y);
            }
        });

        this.physics.add.overlap(this.player, this.bossEnemies, (player, enemy) => {
            if (!enemy.activeHitbox || this._introActiva || this._outroActivo) return;
            const ahora = this.time.now;
            if (ahora - player.lastDamageTime > 1000) {
                player.takeDamage(enemy.damage ?? 2);
                player.lastDamageTime = ahora;
                this.hitSound.play();
                this._applyKnockback(player, enemy.x, enemy.y);
            }
        });

        this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
            if (this._introActiva || this._outroActivo) return;
            if (this.player.isAttacking) {
                this.boss.takeDamage();
                this.bossHitSound.play();
            }
        });

        this.physics.add.overlap(this.player.attackHitbox, this.bossEnemies, (hitbox, enemy) => {
            if (!this.player.isAttacking || this._introActiva || this._outroActivo) return;
            if (!enemy.activeHitbox || enemy.isDead || enemy._hurttimer > 0) return;
            if (enemy.takeHit) {
                enemy.takeHit(this._dirToIndex(this.player.lastDir));
                this.bossHitSound.play();
            }
        });
    }

    _dirToIndex(dir) {
        return { down: 0, right: 1, up: 2, left: 3 }[dir] ?? 0;
    }

    // ─────────────────────────────────────────────────────────
    // HUD
    // ─────────────────────────────────────────────────────────
    _crearBossHUD() {
        // Barra de vida y nombre del boss eliminados permanentemente
    }

    _actualizarBossHUD() {
        // Sin HUD del boss
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
        makeAnim('mantle-idle',                Array.from({length:6},  (_,i) => `mantle_idle_${i}`), 20);
        makeAnim('mantle-dash',                ['mantle_dash_0', 'mantle_dash_1'], 30);
        makeAnim('mantle-onfire',              ['mantle_onfire_0', 'mantle_onfire_1'], 30);
        makeAnim('mantle-release',             Array.from({length:10}, (_,i) => `mantle_release_${i}`), 30, 0);
        makeAnim('mantle-release-abbreviated', Array.from({length:5},  (_,i) => `mantle_release_abbreviated_${i}`), 30, 0);
        makeAnim('mantle-laugh',               ['mantle_laugh_0', 'mantle_laugh_1'], 6);
        makeAnim('mantle-side-r',              Array.from({length:3},  (_,i) => `mantle_side_r_${i}`), 20);
        makeAnim('mantle-side-l',              Array.from({length:3},  (_,i) => `mantle_side_l_${i}`), 20);
    }

    // ─────────────────────────────────────────────────────────
    // TINT DE FASE
    // ─────────────────────────────────────────────────────────
    _crearOverlayGrid() { this._aplicarTintFase(1); }

    _tintTile(col, row, color) {
        const tg = this.groundLayer?.getTileAt(col, row); if (tg) tg.tint = color;
        const tw = this.wallsLayer?.getTileAt(col, row);  if (tw) tw.tint = color;
    }

    _aplicarTintFase(phase) {
        const COLS = 12, ROWS = 9;
        const color = this._phaseColors[Math.min(phase - 1, 3)];
        for (let col = 0; col < COLS; col++)
            for (let row = 0; row < ROWS; row++)
                this._tintTile(col, row, color);
    }

    _iniciarTransicionFase(newPhase) {
        const COLS = 12, ROWS = 9, STEP_MS = 60;
        const newColor = this._phaseColors[Math.min(newPhase - 1, 3)];
        const maxDiag  = (COLS - 1) + (ROWS - 1);
        for (let d = 0; d <= maxDiag; d++) {
            this.time.delayedCall(d * STEP_MS, () => {
                for (let col = 0; col < COLS; col++) {
                    const row = d - col;
                    if (row < 0 || row >= ROWS) continue;
                    this._tintTile(col, row, newColor);
                }
            });
        }
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
    // MUERTE DEL JUGADOR
    // ─────────────────────────────────────────────────────────
    playerDied() {
        if (this.gameIsOver) return;
        this.gameIsOver = true;
        if (this.music?.isPlaying)    this.music.stop();
        if (this.musicNes?.isPlaying) this.musicNes.stop();
        this.registry.set('lastRoom', 'BossScene');
        this.scene.start('GameOverScene', { x: this.player.x, y: this.player.y });
    }

    // ─────────────────────────────────────────────────────────
    // DEBUG
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
        b.hp = hpMap[phase]; b.phase = phase - 1; b.attacktimer = 20;
        b._playAnim('mantle-idle');
        console.log(`[DEBUG] Forzando fase ${phase} — hp: ${b.hp}`);
    }
}