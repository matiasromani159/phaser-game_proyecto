export default class Boat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spr_board_raft');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(36, 36);
        this.setDepth(2);
        this.body.setSize(16, 16);
        this.body.setOffset(0, 0);
        this.body.allowGravity = false;
        this.setImmovable(false);

        this.speed = 80;
        this._bounds = null;
    }

    setBounds(bounds) {
        this._bounds = bounds;
    }

    manejar(cursors, delta, wallsLayer) {
        const dist = this.speed * (delta / 1000);

        let dx = cursors.left.isDown  ? -dist : cursors.right.isDown ? dist : 0;
        let dy = cursors.up.isDown    ? -dist : cursors.down.isDown  ? dist : 0;

        const margen = 16;

        // Usa posiciones guardadas al inicio — no depende del índice animado
       const esAgua = (x, y) => {
    if (!wallsLayer) return true;
    const tile = wallsLayer.getTileAtWorldXY(x, y);
    if (!tile) return false;
    const key = `${tile.x},${tile.y}`;
    
    // Verificar que no es un muelle
    if (this.scene.dockSprites) {
        for (const d of this.scene.dockSprites) {
            const dx = Math.abs(x - d.x);
            const dy = Math.abs(y - d.y);
            if (dx < 18 && dy < 18) return false;
        }
    }

    return this.scene.waterTilePositions?.has(key) ?? false;
};

        // Verificar X separado de Y
        if (dx !== 0) {
            const borde = dx > 0 ? this.x + dx + margen : this.x + dx - margen;
            const puedeX = esAgua(borde, this.y - margen) && esAgua(borde, this.y + margen);
            if (puedeX) this.x += dx;
        }

        if (dy !== 0) {
            const borde = dy > 0 ? this.y + dy + margen : this.y + dy - margen;
            const puedeY = esAgua(this.x - margen, borde) && esAgua(this.x + margen, borde);
            if (puedeY) this.y += dy;
        }

        this.setVelocity(0, 0);
        this.body.reset(this.x, this.y);
    }

    detener() {
        this.setVelocity(0, 0);
    }
}