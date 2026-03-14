import { ShadowMantleBomb }                              from './ShadowMantleBomb.js';
import { ShadowMantleFireController }                    from './ShadowMantleFireController.js';
import { ShadowMantleClone,
         ShadowMantleGroundfire,
         ShadowMantleEnemySpawn }                        from './ShadowMantleHelpers.js';

/**
 * ShadowMantle — Boss principal, traducción fiel del GML de Deltarune.
 *
 * Fases:
 *   1  hp > 22  → burstwave / flamewave
 *   2  hp 13-22 → phase transition + enemywave / dash
 *   3  hp  4-13 → burstwave / enemywave / flamewave
 *   4  hp < 4   → dash continuo + clones
 *
 * Ataques:
 *   burstwavecon  → lanza bombas parabólicas en oleadas
 *   flamewavecon  → mueve al boss por path y activa fire_controller
 *   spawnenemies  → invoca obj___ (ShadowMantleEnemy) en posiciones del mapa
 *   dashcon       → dash parabólico hacia el jugador dejando groundfire
 */
export default class ShadowMantle extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'mantle_idle_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1);
        this.body.allowGravity = false;
        this.body.setImmovable(false);

        // ── Variables de estado (traducción directa del GML Create) ──
        this.hp              = 30;
        this.hp_max          = 30;
        this.hurttimer       = 0;
        this.attacktimer     = 10;
        this.siner           = 0;
        this.isDead          = false;
        this.damage          = 2;

        // Fases
        this.phase               = 1;
        this.phasetransitioncon  = 0;
        this.phasetransitiontimer= 0;
        this.ohmygodimonfire     = 0;

        // Contadores de daño
        this.timeshitthisphase       = 1;
        this.damagetakenduringattack = 0;
        this.hitsduringenemies       = 0;

        // Ataques usados (alternancia)
        this.burstwaveused  = 0;
        this.flamewaveused  = 0;
        this.enemywaveused  = 0;
        this.dashused       = 0;
        this.lastused       = 'none';
        this.darkcandydrop  = false;

        // Burstwave
        this.burstwavecon   = 0;
        this.burstwavetimer = 0;

        // Flamewave
        this.flamewavecon   = 0;
        this.flamewavetimer = 0;

        // Spawn enemies
        this.spawnenemies      = 0;
        this.spawnenemiestimer = 0;

        // Dash
        this.dashcon         = 0;
        this.dashtimer       = 0;
        this.dashcount       = 0;
        this.dashhitboxtimer = 0;

        // Movimiento
        this.movestyle  = 'none';
        this.movecon    = 0;
        this.movetimer  = 0;
        this.targetx    = x;
        this.targety    = y;
        this._vx        = 0;
        this._vy        = 0;

        // Telegrafía
        this.telegraphtimer = 0;
        this.telegraphused  = 0;

        // Fuego visual adherido al boss (fase 4)
        this._fireSprites = [];

        // Número de derrotas previas (afecta daño y comportamiento)
        this.losses = scene.registry.get('shadow_mantle_losses') ?? 0;

        // Hitbox activa del dash
        this._dashHitboxActive = false;

        // Flame wave path — posición objetivo suave
        this._pathTargetX = x;
        this._pathTargetY = y;

        this.play('mantle-idle');

        // Volver a idle automáticamente al terminar release/release-abbreviated
        this.on('animationcomplete', (anim) => {
            if (anim.key === 'mantle-release' || anim.key === 'mantle-release-abbreviated') {
                this._playAnim('mantle-idle');
            }
        });
    }

    // ─────────────────────────────────────────────────────────
    // RECIBIR DAÑO (llamado desde BossScene al detectar overlap)
    // ─────────────────────────────────────────────────────────
    takeDamage() {
        if (this.hurttimer > 0) return;

        // snd_board_bosshit al recibir golpe
        this.scene.sound.stopByKey('snd_board_bosshit');
        this.scene.sound.play('snd_board_bosshit');

        this.hurttimer = 8;

        // Daño escalonado según phasetransitioncon y timeshitthisphase
        if (this.phasetransitioncon === 1) {
            this.hp -= 0.2;
        } else if (this.hp < 5) {
            if (this.dashcon !== 0) this.hp -= 1;
            else                    this.hp -= 0.1;
        } else {
            const t = this.timeshitthisphase;
            if      (t === -2) this.hp -= 2;
            else if (t === -1) this.hp -= 1.5;
            else if (t ===  0) this.hp -= 1;
            else if (t ===  1) this.hp -= 0.75;
            else if (t ===  2) this.hp -= 0.5;
            else               this.hp -= 0.2;

            this.damagetakenduringattack++;
            this.timeshitthisphase++;

            if (this.spawnenemies === 1) this.hitsduringenemies++;
        }

        // Parar dash slow al recibir golpe
        this.scene.sound.stopByKey('snd_board_mantle_dash_slow');

        // Clamp hp mínimo hasta fase 4
        if ((this.phase !== 4 || this.phasetransitioncon === 1) && this.hp < 4)
            this.hp = 4;

        // Muerte
        if (this.hp < 1 || (this.hp < 2 && this.losses >= 7)) {
            this._die();
            return;
        }
    }

    // ─────────────────────────────────────────────────────────
    // UPDATE PRINCIPAL
    // ─────────────────────────────────────────────────────────
    actualizar(delta) {
        if (this.isDead) return;

        // Throttle a 30fps — demasiados timers GML para ajustar individualmente
        this._deltaAccum = (this._deltaAccum ?? 0) + delta;
        if (this._deltaAccum < 25) return;
        this._deltaAccum -= 25;

        const dt = 1;

        // hurttimer
        if (this.hurttimer > 0) {
            this.hurttimer--;
            // Parpadeo blanco al recibir daño
            this.setTint((this.hurttimer % 2 === 0) ? 0xffffff : 0xffffff);
            if (this.hurttimer % 2 === 0) this.clearTint();
            else this.setTint(0xffffff);
        }

        // Restaurar sprite release a idle
        const cur = this._currentAnim;
        if (cur === 'mantle-release' || cur === 'mantle-release-abbreviated') {
            // se resetea al terminar la animación (ver _playAnim)
        }

        // telegraphtimer cuenta atrás
        if (this.telegraphtimer > 0) this.telegraphtimer--;

        // ── Transiciones de fase ──────────────────────────────
        this._checkPhaseTransition();

        // ── Idle si nada activo ───────────────────────────────
        if (
            !this._hasEnemies() &&
            this.burstwavecon === 0 &&
            this.spawnenemies === 0 &&
            this.dashcon === 0 &&
            this.flamewavecon === 0 &&
            this.telegraphtimer === 0 &&
            this.phasetransitioncon === 0
        ) {
            this._vx = 0;
            this._vy = 0;
            this.attacktimer++;
        }

        // ── Resetear ohmygodimonfire si no hay dash/transition ─
        if (this.dashcon === 0 && this.phasetransitioncon === 0)
            this.ohmygodimonfire = 0;

        // ── Elegir ataque ─────────────────────────────────────
        if (this.attacktimer >= 20) this._chooseAttack();

        // ── Ejecutar ataque activo ────────────────────────────
        if (this.burstwavecon === 1)  this._updateBurstwave(dt);
        if (this.spawnenemies === 1)  this._updateSpawnEnemies();
        if (this.flamewavecon === 1)  this._updateFlamewave();
        if (this.dashcon === 1)       this._updateDashPrepare();
        if (this.dashcon === 1.5)     this._updateDashFallback();
        if (this.dashcon === 2)       this._updateDash(delta);

        // ── Movimiento ────────────────────────────────────────
        this._updateMovement(dt);

        // ── Seno vertical (flotación) ─────────────────────────
        this.siner++;
        this.y += Math.sin(this.siner / 3);

        // ── Aplicar velocidad manual ──────────────────────────
        this.x += this._vx;
        this.y += this._vy;

        // ── Velocidad de la risa: empieza rápido y frena (GML: lerp(0.6, 0.1, t/61)) ──
        if (this._currentAnim === 'mantle-laugh' && this.telegraphtimer > 0) {
            const t       = 1 - (this.telegraphtimer / 61); // 0→1 mientras cuenta
            const speed   = Phaser.Math.Linear(0.6, 0.1, t); // 0.6 al inicio, 0.1 al final
            const fps     = speed * 30; // convertir image_speed GML a frameRate Phaser
            if (this.anims.currentAnim) this.anims.msPerFrame = 1000 / Math.max(fps, 1);
        }

        // ── Efecto visual "on fire" ───────────────────────────
        this._updateOnFire();
    }

    // ─────────────────────────────────────────────────────────
    // ELECCIÓN DE ATAQUE
    // ─────────────────────────────────────────────────────────
    _chooseAttack() {
        // Recuperar timeshitthisphase
        if      (this.timeshitthisphase > 0)  this.timeshitthisphase = 0;
        else if (this.timeshitthisphase === 0) this.timeshitthisphase = -1;
        else if (this.timeshitthisphase === -1)this.timeshitthisphase = -2;

        this.scene.destroyFireControllers();

        this.attacktimer          = 0;
        this.damagetakenduringattack = 0;
        this.movecon              = 0;
        this.movetimer            = 0;
        this.dashcount            = 0;
        this.telegraphtimer       = 0;
        this.telegraphused        = 0;
        this.hitsduringenemies    = 0;
        this._vx = 0;
        this._vy = 0;

        // ── Fase 1: hp > 22 ───────────────────────────────────
        if (this.hp > 22) {
            if (this.burstwaveused === 0 && this.flamewaveused === 0) {
                if (this.losses === 0)      this.flamewaveused = 1;
                else if (Phaser.Math.Between(1,2) === 1) this.burstwaveused = 1;
                else                        this.flamewaveused = 1;
            }
            if (this.burstwaveused === 0) {
                this.burstwaveused = 1; this.flamewaveused = 0;
                this.burstwavecon = 1;  this.movestyle = 'cardinal';
            } else {
                this.flamewaveused = 1; this.burstwaveused = 0;
                this.flamewavecon = 1;
            }
        }

        // ── Fase 2: hp 13-22 ──────────────────────────────────
        if (this.hp > 13 && this.hp <= 22) {
            if (this.phase === 1) {
                // primera vez en fase 2 → transition
                this.phase = 2;
                this.phasetransitioncon   = 1;
                this.phasetransitiontimer = 0;
                this.movecon   = 0; this.movetimer = 0;
                this.movestyle = 'to point and stop';
                this.enemywaveused = 1;
            } else {
                if (this.dashused === 0 && this.enemywaveused === 0) {
                    if (Phaser.Math.Between(1,2) === 1) this.enemywaveused = 1;
                    else                                this.dashused = 1;
                }
                if (this.enemywaveused === 0) {
                    this.enemywaveused = 1; this.dashused = 0;
                    this.spawnenemies  = 1;
                } else {
                    this.dashused = 1;   this.enemywaveused = 0;
                    this.dashcon  = 2;   this.movestyle = 'to point and stop';
                }
            }
        }

        // ── Fase 3: hp 4-13 ───────────────────────────────────
        if (this.hp > 4 && this.hp <= 13) {
            if (this.phase === 2) {
                this.phase = 3;
                this.phasetransitioncon   = 1;
                this.phasetransitiontimer = 0;
                this.movecon   = 0; this.movetimer = 0;
                this.movestyle = 'to point and stop';
            } else {
                // Resetear si todos usados
                if (this.burstwaveused === 1 && this.enemywaveused === 1 && this.flamewaveused === 1) {
                    if (this.lastused !== 'burstwave')  this.burstwaveused = 0;
                    if (this.lastused !== 'enemywave')  this.enemywaveused = 0;
                    if (this.lastused !== 'flamewave')  this.flamewaveused = 0;
                }
                let attack = Phaser.Math.Between(0, 2);
                let chosen = false;
                for (let i = 0; i < 4 && !chosen; i++) {
                    if (this.hp <= 4) {
                        this.hp = 4; this.dashcon = 2; this.dashtimer = 5;
                        this.movestyle = 'to point and stop'; chosen = true;
                    } else if (attack === 0 && this.burstwaveused === 0) {
                        this.burstwaveused = 1; chosen = true;
                        this.burstwavecon  = 1; this.movestyle = 'cardinal';
                        this.lastused = 'burstwave';
                    } else if (attack === 1 && this.enemywaveused === 0) {
                        this.enemywaveused = 1; chosen = true;
                        this.spawnenemies  = 1; this.lastused = 'enemywave';
                    } else if (attack === 2 && this.flamewaveused === 0) {
                        this.flamewaveused = 1; chosen = true;
                        this.flamewavecon  = 1; this.lastused = 'flamewave';
                    } else {
                        attack = (attack + 1) % 3;
                    }
                }
            }
        }

        // ── Fase 4: hp <= 4 ───────────────────────────────────
        if (this.hp <= 4) {
            if (this.phase === 3) {
                this.phase = 4;
                this.phasetransitioncon   = 1;
                this.phasetransitiontimer = 0;
                this.movecon   = 0; this.movetimer = 0;
                this.movestyle = 'to point and stop';
            } else {
                this.dashcon   = 2;
                this.movestyle = 'to point and stop';
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // BURSTWAVE
    // ─────────────────────────────────────────────────────────
    _updateBurstwave(dt) {
        this.burstwavetimer++;
        const t = this.burstwavetimer;

        if (this.hp > 13) {
            // ── Fase 1 burstwave ─────────────────────────────
            const schedule = [
                [1,   'mantle-release',    null],
                [11,  null,                { rx: 0, ry: 29, tx: [160,320+1], ty: [96,  96+32+1]  }],
                [17,  'mantle-release-abbreviated', null],
                [21,  null,                { rx: 0, ry: 29, tx: [160,320+1], ty: [160, 160+32+1] }],
                [27,  'mantle-release-abbreviated', null],
                [31,  null,                { rx: 0, ry: 29, tx: [160,320+1], ty: [224, 224+32+1] }],
                [121, 'mantle-release',    null],
                [131, null,                { rx: 0, ry: 29, tx: [160,320+1], ty: [96,  96+32+1]  }],
                [137, 'mantle-release-abbreviated', null],
                [141, null,                { rx: 0, ry: 29, tx: [160,320+1], ty: [160, 160+32+1] }],
                [147, 'mantle-release-abbreviated', null],
                [151, null,                { rx: 0, ry: 29, tx: [160,320+1], ty: [224, 224+32+1] }],
            ];
            this._processBurstSchedule(schedule, t);

            if (t >= 182) this._endBurstwave();
        } else {
            // ── Fase 3 burstwave (más bombas, área más grande) ─
            const schedule = [
                [1,   'mantle-release',    null],
                [11,  null,                { rx: 0, ry: 16, tx: [160,160+4*32+1], ty: [96,  96+2*32+1]  }],
                [17,  'mantle-release-abbreviated', null],
                [21,  null,                { rx: 0, ry: 16, tx: [320,320+4*32+1], ty: [96,  96+2*32+1]  }],
                [27,  'mantle-release-abbreviated', null],
                [31,  null,                { rx: 0, ry: 16, tx: [160,160+4*32+1], ty: [192, 192+2*32+1] }],
                [37,  'mantle-release-abbreviated', null],
                [41,  null,                { rx: 0, ry: 16, tx: [320,320+4*32+1], ty: [192, 192+2*32+1] }],
                [81,  'mantle-release',    null],
                [91,  null,                { rx: 0, ry: 16, tx: [160,160+4*32+1], ty: [96,  96+2*32+1]  }],
                [97,  'mantle-release-abbreviated', null],
                [101, null,                { rx: 0, ry: 16, tx: [320,320+4*32+1], ty: [96,  96+2*32+1]  }],
                [107, 'mantle-release-abbreviated', null],
                [111, null,                { rx: 0, ry: 16, tx: [160,160+4*32+1], ty: [192, 192+2*32+1] }],
                [117, 'mantle-release-abbreviated', null],
                [121, null,                { rx: 0, ry: 16, tx: [320,320+4*32+1], ty: [192, 192+2*32+1] }],
            ];
            this._processBurstSchedule(schedule, t);

            if (t >= 152) this._endBurstwave();
        }
    }

    _processBurstSchedule(schedule, t) {
        for (const [time, anim, bomb] of schedule) {
            if (t === time) {
                if (anim) this._playAnim(anim);
                if (bomb) this._spawnBomb(bomb.rx, bomb.ry, bomb.tx, bomb.ty);
            }
        }
    }

    _spawnBomb(rx, ry, txRange, tyRange) {
        const scene = this.scene;

        // El GML usa un bomb_spawner que genera posiciones candidatas
        // filtradas por y entre 128-192 (escala GML). Aquí generamos
        // posiciones dentro del área jugable de 432x324.
        const candidates = [];
        for (let ix = 0; ix < 11; ix++) {
            for (let iy = 0; iy < 7; iy++) {
                const cx = 32  + ix * 32;
                const cy = 80  + iy * 24;
                // Filtrar franja vertical equivalente al GML (y 128-192 de 320px = 40%-60%)
                if (cy < 97 || cy > 194) continue;
                candidates.push({ x: cx, y: cy });
            }
        }

        // Filtrar candidatos muy cerca del jugador
        const player = scene.player;
        const valid = candidates.filter(c =>
            Phaser.Math.Distance.Between(c.x, c.y, player.x, player.y) >= 50
        );

        const pool = valid.length > 0 ? valid : candidates;
        const pos  = pool[Phaser.Math.Between(0, pool.length - 1)];

        const bomb = new ShadowMantleBomb(scene, this.x + rx, this.y + ry, pos.x, pos.y);
        scene.bossBullets.add(bomb);
    }

    _endBurstwave() {
        this._vx = 0; this._vy = 0;

        if (this.telegraphtimer === 0 && this.damagetakenduringattack === 0) {
            this._playAnim('mantle-laugh');
            this.scene.sound.play('snd_board_mantle_laugh_mid', { detune: 500 }); // pitch 1.3
            this.telegraphtimer = 61;
        }

        if (
            this.telegraphtimer <= 1 ||
            (this.damagetakenduringattack >= 1 && this.telegraphtimer > 0 && this.telegraphtimer <= 31)
        ) {
            this.burstwavecon   = 0;
            this.burstwavetimer = 0;
            this._playAnim('mantle-idle');
        }
    }

    // ─────────────────────────────────────────────────────────
    // SPAWN ENEMIES
    // ─────────────────────────────────────────────────────────
    _updateSpawnEnemies() {
        this.spawnenemiestimer++;
        const t = this.spawnenemiestimer;

        if (t === 1) {
            const spr = Phaser.Math.Between(0,1) === 0 ? 'mantle-side-r' : 'mantle-side-l';
            this._playAnim(spr);
        }

        if (t === 15 || t === 30 || t === 45 || t === 60 || t === 75) {
            this.scene.sound.stopByKey('snd_board_summon');
            this.scene.sound.play('snd_board_summon');
            const moveType = (t === 30 || t === 75) ? 1 : 0;
            new ShadowMantleEnemySpawn(this.scene, this.x, this.y, moveType, this);
        }

        if (t === 75) this.hitsduringenemies = 0;

        if (t === 77) {
            this.hitsduringenemies++;
            this._playAnim('mantle-laugh');
            this.scene.sound.play('snd_board_mantle_laugh_mid', { detune: 500 }); // pitch 1.3
        }

        if (t === 106) this._playAnim('mantle-idle');

        if (t === 126) this.spawnenemiestimer = 76;

        // Si el jugador golpeó suficiente durante la wave, cancelar
        if (t >= 77 && this.hitsduringenemies > 4) {
            this._playAnim('mantle-idle');
            this.spawnenemies      = 0;
            this.spawnenemiestimer = 0;
            this.dashcount         = 0;
            this.dashused          = 1;
            this.enemywaveused     = 0;
            this.damagetakenduringattack = 0;
            this.timeshitthisphase = 0;
            this.dashcon           = 2;
            this.dashtimer         = -1;
            this.telegraphtimer    = 0;
            this.movestyle         = 'to point and stop';
        }
    }

    // ─────────────────────────────────────────────────────────
    // FLAMEWAVE
    // ─────────────────────────────────────────────────────────
    _updateFlamewave() {
        this.flamewavetimer++;
        const t = this.flamewavetimer;

        if (t === 1) this.movestyle = 'path';

        // Crear fire_controller en estos frames
        if (t === 10 || t === 60 || t === 110 || t === 160) {
            const type = this.hp > 13 ? 4 : 5;
            const fc = new ShadowMantleFireController(
                this.scene, this.x, this.y,
                t === 10 ? 4.5 : type,
                this
            );
            this.scene.fireControllers.push(fc);
        }

        // En fase 3 flamewave también lanza bombas
        if (this.hp <= 13) {
            const bombTimes = [30, 60, 90, 120];
            const animTimes = [20, 50, 80, 110];
            if (animTimes.includes(t)) this._playAnim('mantle-release');
            if (bombTimes.includes(t)) {
                this._spawnBomb(16, 16,
                    [160, 160 + 9*32 + 1],
                    [96,  96  + 5*32 + 1]
                );
            }
        }

        if (t >= 210) {
            this.flamewavecon   = 0;
            this.flamewavetimer = 0;
        }
    }

    // ─────────────────────────────────────────────────────────
    // TRANSICIÓN DE FASE
    // ─────────────────────────────────────────────────────────
    _checkPhaseTransition() {
        // Resetear estado si entra en threshold de transición
        if (
            (this.hp <= 22 && this.phase === 1) ||
            (this.hp <= 13 && this.phase === 2) ||
            (this.hp <= 4  && this.phase === 3)
        ) {
            this.burstwavecon = 0; this.burstwavetimer = 0;
            this.spawnenemies = 0; this.spawnenemiestimer = 0;
            this.dashcon      = 0; this.dashtimer = 0;
            this.dashused     = 0; this.dashcount = 0;
            this.flamewavecon = 0; this.flamewavetimer = 0;
            this.telegraphtimer    = 0;
            this.phasetransitioncon= 0;
            this.attacktimer       = 20;
            this.darkcandydrop     = false;
            this._playAnim('mantle-idle');
            this._vx = 0; this._vy = 0;
            this.scene.destroyFireControllers();
        }

        if (this.phasetransitioncon === 1) {
            this.phasetransitiontimer++;
            const t = this.phasetransitiontimer;

            if (t === 25) {
                this.scene.sound.play('snd_board_mantle_move', { detune: -500 }); // pitch 0.7 ≈ -500 cents
                this.scene.events.emit('boss-phase-transition');
            }

            if (t === 46 && this.phase === 4) {
                this._playAnim('mantle-dash');
                this.ohmygodimonfire = 1;
                this.phasetransitioncon  = 2;
                this.phasetransitiontimer= 0;
            }

            if (t >= 47 && this.scene.fireControllers.length === 0) {
                this.phasetransitioncon  = 0;
                this.phasetransitiontimer= 0;
                this.attacktimer         = 20;
                this.ohmygodimonfire     = 0;
            }
        }

        if (this.phasetransitioncon === 2) {
            this.phasetransitiontimer++;
            const t = this.phasetransitiontimer;

            if (t === 1) {
                this._playAnim('mantle-dash');
                this.ohmygodimonfire = 1;
                this.scene.sound.play('snd_board_torch_high');
            }

            // Torch high cada 5 frames hasta t=52
            if (t % 5 === 0 && t < 52 && t > 1) {
                this.scene.sound.play('snd_board_torch_high');
            }

            // Partículas
            if (t % 2 === 0 && t < 45) {
                const rand = Phaser.Math.Between(0, 360);
                this.scene.events.emit('boss-transition-particle', {
                    x: this.x + 16 + Math.cos(Phaser.Math.DegToRad(rand)) * 42,
                    y: this.y + 16 + Math.sin(Phaser.Math.DegToRad(rand)) * 42,
                });
            }

            // Alternar sprite dash/onfire
            if (t > 10 && t < 52) {
                const anim = (this._currentAnim === 'mantle-dash') ? 'mantle-onfire' : 'mantle-dash';
                this._playAnim(anim);
            }

            if (t === 42) {
                const fc = new ShadowMantleFireController(this.scene, this.x, this.y, 8, this);
                this.scene.fireControllers.push(fc);
            }

            if (t === 72) {
                this._playAnim('mantle-idle');
                this.ohmygodimonfire = 0;
            }

            if (t >= 83 && this.scene.fireControllers.length === 0) {
                this.phasetransitioncon  = 0;
                this.phasetransitiontimer= 0;
                this.attacktimer         = -10;
                this.ohmygodimonfire     = 0;
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // DASH — fase de preparación (dashcon 1)
    // ─────────────────────────────────────────────────────────
    _updateDashPrepare() {
        if (this._dashPrepared) return;
        this._dashPrepared = true;

        if (
            (this.dashcount > 2 ||
            (this.damagetakenduringattack > 2 && this.dashcount > 1)) &&
            this.hp > 4
        ) {
            // GML: vspeed = 16, x reposicionado, dashcon = 1.5
            // El boss cae hacia abajo; _updateDashFallback espera a que y > bounds.y + 152
            this._vy   = 16;
            this.x     = 224 + Phaser.Math.Between(0, 5) * 32;
            this.dashcon   = 1.5;
            this.dashtimer = 0;
            this._dashPrepared = false; // resetear para que 1.5 pueda volver a 1 limpiamente
        } else {
            const player  = this.scene.player;
            const offsetX = Phaser.Math.Between(0,1) === 0 ? 0 : (Phaser.Math.Between(0,1) === 0 ? 66 : -66);
            this._dashDir = Phaser.Math.Angle.Between(
                this.x + 16, this.y + 16,
                player.x + 16 + offsetX, player.y + 16
            );
            this._dashGravity = this.losses >= 7 ? 0.2 : 0.24;
            this._dashSpeed   = 2;
            this.dashtimer    = 28;
            this.dashcon      = 2;
            this.dashcount++;
            this._dashPrepared = false;
        }
    }

    // ─────────────────────────────────────────────────────────
    // DASH — fallback (dashcon 1.5) — boss cae fuera, ríe y reinicia
    // ─────────────────────────────────────────────────────────
    _updateDashFallback() {
        const bounds = this.scene.physics.world.bounds;

        // El boss cae con _vy hasta salir de pantalla (GML: vspeed = 16)
        if (this._vy !== 0) {
            this.y += this._vy;
        }

        // Igual que GML: if (y > cameray() + 152 || telegraphtimer > 0)
        if (this.y > bounds.y + 152 || this.telegraphtimer > 0) {
            this._vy             = 0;
            this._dashSpeed      = 0;
            this._dashGravityAmt = 0;
            this.ohmygodimonfire = 0;

            if (this.telegraphtimer === 0) {
                this._playAnim('mantle-laugh');
                this.scene.sound.play('snd_board_mantle_laugh_mid', { detune: 500 }); // pitch 1.3
                this.telegraphtimer = 46;
            }

            if (this.telegraphtimer === 1) {
                this._playAnim('mantle-idle');
                this.attacktimer    = 19;
                this.dashcon        = 0;
                this.telegraphtimer = 0;
                this._dashPrepared  = false;
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // DASH — el dash real (dashcon 2)
    // ─────────────────────────────────────────────────────────
    _updateDash(delta) {
        this.dashtimer++;
        const dt = delta / 16.667;
        const player = this.scene.player;
        const bounds = this.scene.physics.world.bounds;

        if (this.dashtimer === 10 && this._dashFriction === 0) {
            this._playAnim('mantle-dash');
            this.ohmygodimonfire = 1;
            this.scene.sound.play('snd_wing', { volume: 1.2 });

            const offsetX = Phaser.Math.Between(0,1) === 0 ? 0 : (Phaser.Math.Between(0,1) === 0 ? 66 : -66);
            let dir = Phaser.Math.Angle.Between(
                this.x+16, this.y+16,
                player.x+16+offsetX, player.y+16
            );
            const dirDeg = Phaser.Math.RadToDeg(dir);
            // Solo permitir ángulos entre 200-330 (hacia abajo)
            let d = dirDeg;
            if (d < 200 || d > 330) d = 200 + Phaser.Math.Between(0, 130);
            this._dashDir     = Phaser.Math.DegToRad(d);
            this._dashGravity = this._dashGravDir = this._dashDir;

            const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (dist >= 70) {
                this._dashFriction = 0.4;
                this._dashSpeed    = -6;
            } else {
                this._dashFriction = 0.14;
                this._dashSpeed    = -4;
                this.dashtimer     = 0;
            }
        }

        if (this.dashtimer === 28) {
            this.scene.sound.stopByKey('snd_board_mantle_dash_slow');
            this.scene.sound.play('snd_board_mantle_dash_slow', { detune: Phaser.Math.Between(-50, 50) });
            this._dashFriction    = 0;
            this._dashGravityAmt  = 0.5;
            this._dashSpeed       = 10;
        }

        // Clones en fase 4
        if (this.dashcount > 0 && this.hp <= 4) {
            if (this.dashtimer === 44) this._spawnClone();
            if (this.dashtimer === 58) this._spawnClone();
        }

        // Aumentar gravedad + dejar rastro de fuego
        if (this.dashtimer >= 30 && this.dashtimer % 4 === 0) {
            if      (this.hp >= 5)          this._dashGravityAmt = (this._dashGravityAmt||0.5) + 0.03 * dt;
            else if (this.losses < 7)        this._dashGravityAmt += 0.03  * dt;
            else if (this.losses < 14)       this._dashGravityAmt += 0.023 * dt;
            else                             this._dashGravityAmt += 0.017 * dt;

            new ShadowMantleGroundfire(this.scene, this.x, this.y);
        }

        // Aplicar movimiento de dash
        if (this._dashFriction > 0) {
            this._dashSpeed *= (1 - this._dashFriction);
        }
        if (this._dashGravityAmt) {
            this._dashSpeed += this._dashGravityAmt * dt;
        }
        this.x += Math.cos(this._dashDir || 0) * (this._dashSpeed || 0);
        this.y += Math.sin(this._dashDir || 0) * (this._dashSpeed || 0);

        // Hitbox activa durante el dash
        if (this.ohmygodimonfire === 1) {
            this.dashhitboxtimer++;
            if (this.dashhitboxtimer > 20) {
                this._dashHitboxActive = true;
            }
        } else {
            this.dashhitboxtimer = 0;
            this._dashHitboxActive = false;
        }

        // Salir de límites → reposicionar arriba y volver a dashcon 1
        if (
            this.x < bounds.x + 32 || this.x > bounds.right ||
            this.y > bounds.bottom || this.y < bounds.y - 100
        ) {
            this.dashtimer        = 0;
            this.dashcon          = 1;
            this._dashSpeed       = 0;
            this._dashGravityAmt  = 0;
            this._dashFriction    = 0;
            this._dashPrepared    = false;
            this.ohmygodimonfire  = 0;
            // Reposicionar arriba igual que el GML
            this.x = 160 + Phaser.Math.Between(0, 9) * 32;
            this.y = bounds.y - 10;
        }
    }

    // ─────────────────────────────────────────────────────────
    // MOVIMIENTO
    // ─────────────────────────────────────────────────────────
    _updateMovement(dt) {
        const bounds = this.scene.physics.world.bounds;
        const W = 432;
        const H = 324;

        if (this.movestyle === 'to point and stop') {
            if (this.movetimer > 6) this.movetimer = 0;

            if (this.movecon === 0) {
                this._vx = 0; this._vy = 0;

                if (this.phasetransitioncon === 1) {
                    this.targetx = W / 2; this.targety = H / 2;
                } else if (this.spawnenemies === 1) {
                    // targetx/targety los setea ShadowMantleEnemySpawn — solo activar movecon
                    // si aún no tienen valor, quedarse en el sitio
                    if (this.targetx === undefined) this.targetx = this.x;
                    if (this.targety === undefined) this.targety = this.y;
                } else {
                    this.targetx = 32  + Phaser.Math.Between(0, 9) * 32;
                    this.targety = 48  + Phaser.Math.Between(0, 4) * 32;

                    if (this.dashcon === 2) {
                        const player = this.scene.player;
                        this.targetx = Phaser.Math.Clamp(
                            (player.x - 40) + Phaser.Math.Between(0, 80), 32, W - 32
                        );
                        this.targety = 48;
                    }
                }
                this.movecon = 1; this.movetimer = 0;
            }

            if (this.movecon === 1) {
                this.movetimer++;
                this.x = Phaser.Math.Linear(this.x, this.targetx, this.movetimer / 6);
                this.y = Phaser.Math.Linear(this.y, this.targety,  this.movetimer / 6);

                if (this.movetimer === 6) {
                    this.movecon   = 0;
                    this.movetimer = 0;
                    this.movestyle = 'none';
                }
            }
        }

        if (this.movestyle === 'cardinal') {
            if (this.movecon === 0) {
                const spd = this.hp <= 13 ? 7 : 5;
                let rand = Phaser.Math.Between(0, 3);

                // Forzar dirección si está en borde (escalado a 432x324)
                if (this.y + 16 < 80)        { this._vy =  spd; this._vx = 0; }
                else if (this.y + 16 > 200)  { this._vy = -spd; this._vx = 0; }
                else if (this.x + 16 < 60)   { this._vx =  spd; this._vy = 0; }
                else if (this.x + 16 > 370)  { this._vx = -spd; this._vy = 0; }
                else {
                    if (rand === 0) { this._vx =  spd; this._vy = 0; }
                    if (rand === 1) { this._vy = -spd; this._vx = 0; }
                    if (rand === 2) { this._vx = -spd; this._vy = 0; }
                    if (rand === 3) { this._vy =  spd; this._vx = 0; }
                }
                this.movecon = 1;
            }

            if (this.movecon === 1) {
                this.movetimer++;
                if (this.movetimer === 20) {
                    this.movecon = 0; this.movetimer = 0;
                }
            }

            // Rebotes en bordes
            if (this.x > W - 32)       { this._vx = -5; this._vy = 0; this.movetimer = 0; this.movecon = 0; }
            if (this.x < 32)           { this._vx =  5; this._vy = 0; this.movetimer = 0; this.movecon = 0; }
            if (this.y > H)            { this._vy = -5; this._vx = 0; this.movetimer = 0; this.movecon = 0; }
            if (this.y < 0)            { this._vy =  5; this._vx = 0; this.movetimer = 0; this.movecon = 0; }
        }

        if (this.movestyle === 'path') {
            // Seguir path suavemente (equivale a lerp hacia obj_shadow_mantle_path)
            this.x = Phaser.Math.Linear(this.x, this._pathTargetX, 0.15);
            this.y = Phaser.Math.Linear(this.y, this._pathTargetY, 0.15);
        } else {
            // Sin path: resetear firetrailtimer
        }
    }

    // Llamado desde BossScene para actualizar el destino del path de flamewave
    setPathTarget(px, py) {
        this._pathTargetX = px;
        this._pathTargetY = py;
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────
    _spawnClone() {
        const clone = new ShadowMantleClone(
            this.scene,
            32 + Phaser.Math.Between(0, 11) * 32,
            20
        );
        this.scene.bossEnemies.add(clone);
    }

    _updateOnFire() {
        // El efecto "on fire" se dibuja en BossScene sobre el boss
        // usando el sprite spr_board_imonfire con tint rojo
        this.scene.events.emit('boss-onfire', {
            active: this.ohmygodimonfire > 0,
            x: this.x, y: this.y
        });
    }

    _hasEnemies() {
        return this.scene.bossEnemies &&
               this.scene.bossEnemies.getChildren().some(e => !e.isDead);
    }

    _playAnim(key) {
        this._currentAnim = key;
        const exists = this.scene.anims.exists(key);
        if (!exists) {
            console.warn(`[ShadowMantle] Animación no encontrada: "${key}"`);
            return;
        }
        this.play(key, true);
    }

    // ─────────────────────────────────────────────────────────
    // MUERTE
    // ─────────────────────────────────────────────────────────
    _die() {
        if (this.isDead) return;
        this.isDead = true;

        this.scene.registry.set(
            'shadow_mantle_losses',
            (this.scene.registry.get('shadow_mantle_losses') ?? 0) + 1
        );

        this.scene.events.emit('boss-defeated');
        this.destroy();
    }
}