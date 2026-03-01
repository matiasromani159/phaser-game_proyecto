export default class Monster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.setScale(2);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.isDead      = false;
        this.CELL_SIZE   = 64;

        // ── AJUSTA ESTOS VALORES ──────────────────────────────
        this.spd              = 1;   // px por frame activo (menos = más lento)
        this.UPDATE_INTERVAL  = 2;   // frames entre cada movimiento (más = más lento)
        this.WAIT_BETWEEN     = 0;  // frames de pausa entre celdas (más = más tiempo pensando)
        // ─────────────────────────────────────────────────────

        this.movedir     = Phaser.Math.Between(0, 3);
        this.movecon     = 0;
        this.movetimer   = 0;
        this.updatetimer = 0;
        this.waittimer   = 0;  // cuenta la pausa entre celdas

        // 0=der 1=arr 2=izq 3=abj
        this.DIRS = [
            {  x: 1,  y:  0 },
            {  x: 0,  y: -1 },
            {  x: -1, y:  0 },
            {  x: 0,  y:  1 },
        ];

        this.play('monster-walk');
    }

    actualizar() {
        if (this.isDead) return;

        // ── Intervalo de movimiento ──────────────────────────
        this.updatetimer++;
        if (this.updatetimer < this.UPDATE_INTERVAL) return;
        this.updatetimer = 0;

        // ── Pausa entre celdas (tiempo de "decisión") ────────
        if (this.movecon === 0) {
            this.waittimer++;
            if (this.waittimer < this.WAIT_BETWEEN) return;
            this.waittimer = 0;

            // Elegir dirección aleatoria evitando paredes
            this.movedir = Phaser.Math.Between(0, 3);
            for (let i = 0; i < 4; i++) {
                const off  = this.DIRS[this.movedir];
                const tile = this.scene.wallsLayer.getTileAtWorldXY(
                    this.x + off.x * this.CELL_SIZE,
                    this.y + off.y * this.CELL_SIZE
                );
                if (tile && tile.collides) {
                    this.movedir = (this.movedir + 1) % 4;
                } else {
                    break;
                }
            }

            this.movecon = 1;
        }

        // ── Moverse spd píxeles ──────────────────────────────
        if (this.movecon === 1) {
            this.movetimer++;
            const dir  = this.DIRS[this.movedir];
            let   stop = 0;

            for (let i = 0; i < this.spd; i++) {
                if (stop) break;

                this.x += dir.x;
                this.y += dir.y;

                const tile   = this.scene.wallsLayer.getTileAtWorldXY(this.x, this.y);
                const bounds = this.scene.physics.world.bounds;
                const choca  = (tile && tile.collides) ||
                               this.x < bounds.x || this.x > bounds.right ||
                               this.y < bounds.y || this.y > bounds.bottom;

                if (choca) {
                    this.x -= dir.x;
                    this.y -= dir.y;
                    this.movedir   = (this.movedir + 2) % 4;
                    this.movecon   = 0;
                    this.movetimer = 0;
                    stop = 1;
                    break;
                }

                const completoCelda =
                    ((this.movedir === 0 || this.movedir === 2) && (Math.round(this.x) % this.CELL_SIZE) === 0) ||
                    ((this.movedir === 1 || this.movedir === 3) && (Math.round(this.y) % this.CELL_SIZE) === 0);

                if (completoCelda) {
                    this.movecon   = 0;
                    this.movetimer = 0;
                    stop = 1;
                }
            }

            this.flipX = this.movedir === 2;
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        this.setVelocity(0, 0);
        this.body.enable = false;

        this.play('monster-die');
        this.once('animationcomplete', () => {
            this.destroy();
        });
    }
}