export default class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create(data) {
        const W = this.scale.width;
        const H = this.scale.height;
        const centerX = W / 2;

        // Forzar cámara visible
        this.cameras.main.setVisible(true);
        this.cameras.main.setAlpha(1);
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(100, 0, 0, 0);

        // Fondo opaco
        this.add.rectangle(centerX, H / 2, W, H, 0x000000, 1.0)
            .setOrigin(0.5);

        // Título
        this.add.text(centerX, 28, 'CONTROLES', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '20px',
            color: '#ffffff',
        }).setOrigin(0.5).setResolution(10);

        this.add.rectangle(centerX, 44, 160, 2, 0x5bc0de).setOrigin(0.5);

        // Controles
        const controles = [
            { keys: '↑ ↓ ← →', action: 'Moverse' },
            { keys: 'Z',       action: 'Atacar / Confirmar' },
            { keys: 'X',       action: 'Cancelar / Atrás' },
            { keys: 'ESC',     action: 'Menú / Pausa' },
        ];

        let y = 65;
        controles.forEach(ctrl => {
            const keyWidth = ctrl.keys.length > 3 ? 70 : 32;
            this.add.rectangle(centerX - 75, y, keyWidth, 18, 0x2b3e50)
                .setOrigin(0.5)
                .setStrokeStyle(1, 0x5bc0de);

            this.add.text(centerX - 75, y, ctrl.keys, {
                fontFamily: 'UndertaleFont, monospace',
                fontSize: '9px',
                color: '#5bc0de',
            }).setOrigin(0.5).setResolution(10);

            this.add.text(centerX + 15, y, ctrl.action, {
                fontFamily: 'UndertaleFont, monospace',
                fontSize: '10px',
                color: '#ccccdd',
            }).setOrigin(0, 0.5).setResolution(10);

            y += 28;
        });

        // Sección IA
        y += 8;
        this.add.rectangle(centerX, y + 22, 260, 55, 0x1a1a2e)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffd700);

        this.add.text(centerX - 110, y + 22, '★', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '14px',
            color: '#ffd700',
        }).setOrigin(0.5).setResolution(10);

        this.add.text(centerX, y + 8, 'ASISTENTE IA', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '12px',
            color: '#ffd700',
        }).setOrigin(0.5).setResolution(10);

        this.add.text(centerX, y + 26, 'Pulsa  \\cYH\\c0  en cualquier momento', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '9px',
            color: '#aaaaaa',
        }).setOrigin(0.5).setResolution(10);

        this.add.text(centerX, y + 38, 'para pedir ayuda a la IA', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '9px',
            color: '#aaaaaa',
        }).setOrigin(0.5).setResolution(10);

        // Volver
        this.add.text(centerX, H - 20, 'Pulsa  \\cYZ\\c0  o  \\cYENTER\\c0  para volver', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '9px',
            color: '#666688',
        }).setOrigin(0.5).setResolution(10);

        // Input
        this.input.keyboard.once('keydown-Z', this._volver, this);
        this.input.keyboard.once('keydown-ENTER', this._volver, this);
    }

    _volver() {
        this.cameras.main.fadeOut(150, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop();
            this.scene.resume('MenuScene');
        });
    }
}