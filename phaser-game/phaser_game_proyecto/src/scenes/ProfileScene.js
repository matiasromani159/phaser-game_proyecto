// scenes/ProfileScene.js
import GameState from '../GameState.js';

export default class ProfileScene extends Phaser.Scene {
    constructor() {
        super('ProfileScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        // Fondo oscuro
        this.cameras.main.setBackgroundColor('#000000');

        // Estrellas de fondo (decoración sutil)
        for (let i = 0; i < 50; i++) {
            this.add.circle(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H),
                Phaser.Math.Between(1, 2),
                0xffffff,
                Phaser.Math.FloatBetween(0.3, 0.8)
            );
        }

        // Título
        this.add.text(cx, 40, 'PERFIL DEL JUGADOR', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setResolution(10);

        // Caja principal
        const boxW = 420;
        const boxH = 280;
        const boxX = cx - boxW / 2;
        const boxY = cy - boxH / 2 + 10;

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRect(boxX, boxY, boxW, boxH);

        // Nombre del jugador
        this.add.text(cx, boxY + 25, GameState.playerName, {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5).setResolution(10);

        // Stats placeholder (se rellenan al cargar)
        this.statsTexts = [];
        const statLabels = [
            ['Partidas:', 'partidasJugadas'],
            ['Tiempo total:', 'tiempoTotal', 's'],
            ['Tiempo máximo:', 'tiempoMaximo', 's'],
            ['Nivel máximo:', 'nivelMaximo'],
            ['Monstruos:', 'monstruosMatados'],
            ['Escenas:', 'escenasVisitadas']
        ];

        statLabels.forEach(([label, key, suffix = ''], i) => {
            const y = boxY + 65 + i * 32;
            this.add.text(boxX + 30, y, label, {
                fontFamily: 'UndertaleFont, monospace',
                fontSize: '16px',
                color: '#aaaaaa'
            }).setResolution(10);

            const valueText = this.add.text(boxX + boxW - 30, y, '...', {
                fontFamily: 'UndertaleFont, monospace',
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(1, 0).setResolution(10);

            this.statsTexts.push({ key, text: valueText, suffix });
        });

        // Cargar stats del servidor
        this.cargarStats();

        // Botón volver
        this.botonVolver = this.crearBoton(cx, boxY + boxH + 40, 'VOLVER', () => {
            this.scene.start('MenuScene');
        });

        // Botón ranking (si quieres)
        this.botonRanking = this.crearBoton(cx, boxY + boxH + 80, 'RANKING', () => {
            this.mostrarRanking();
        });

        // Cursor/corazón selector
        this.cursor = this.add.text(0, 0, '♥', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '16px',
            color: '#ff0000'
        }).setResolution(10).setVisible(false);

        this.botones = [this.botonVolver, this.botonRanking];
        this.botonIndex = 0;
        this.actualizarCursor();

        // Input teclado
        this.input.keyboard.on('keydown-UP', () => {
            this.botonIndex = (this.botonIndex - 1 + this.botones.length) % this.botones.length;
            this.actualizarCursor();
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            this.botonIndex = (this.botonIndex + 1) % this.botones.length;
            this.actualizarCursor();
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            this.botones[this.botonIndex].callback();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    crearBoton(x, y, texto, callback) {
        const t = this.add.text(x, y, texto, {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setResolution(10).setInteractive();

        t.on('pointerover', () => t.setColor('#ffff00'));
        t.on('pointerout', () => t.setColor('#ffffff'));
        t.on('pointerdown', callback);
        t.callback = callback;

        return t;
    }

    actualizarCursor() {
        const btn = this.botones[this.botonIndex];
        this.cursor.setPosition(btn.x - btn.width / 2 - 20, btn.y);
        this.cursor.setVisible(true);
    }

    cargarStats() {
        fetch('/php/stats.php')
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.statsTexts.forEach(({ key, text, suffix }) => {
                        const val = data.stats[key] ?? 0;
                        text.setText(val + suffix);
                    });
                }
            })
            .catch(() => {
                // Fallback: mostrar datos locales
                this.statsTexts.forEach(({ key, text, suffix }) => {
                    const localVal = {
                        partidasJugadas: 1,
                        tiempoTotal: GameState.segundos,
                        tiempoMaximo: GameState.segundos,
                        nivelMaximo: GameState.playerLevel,
                        monstruosMatados: GameState.monstersDead.length,
                        escenasVisitadas: 1
                    }[key] ?? 0;
                    text.setText(localVal + suffix);
                });
            });
    }

    mostrarRanking() {
        // Overlay simple de ranking
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        const overlay = this.add.rectangle(cx, H / 2, W - 40, H - 60, 0x000000, 0.95)
            .setStrokeStyle(2, 0xffffff);

        const titulo = this.add.text(cx, 60, 'RANKING TOP', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5).setResolution(10);

        const lista = this.add.text(cx, 100, 'Cargando...', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0).setResolution(10);

        fetch('/php/ranking.php')
            .then(r => r.json())
            .then(data => {
                if (data.ok && data.ranking.length) {
                    const lines = data.ranking.slice(0, 10).map((p, i) => {
                        const medal = i < 3 ? ['🥇','🥈','🥉'][i] : `${i + 1}.`;
                        return `${medal} ${p.username} - Nvl.${p.nivelMaximo} - ${p.tiempoTotal}s`;
                    });
                    lista.setText(lines.join('\n'));
                } else {
                    lista.setText('No hay datos aún');
                }
            })
            .catch(() => lista.setText('Error al cargar ranking'));

        // Botón cerrar
        const cerrar = this.add.text(cx, H - 50, 'CERRAR [ESC]', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '16px',
            color: '#ff6666'
        }).setOrigin(0.5).setResolution(10).setInteractive();

        cerrar.on('pointerdown', () => {
            overlay.destroy();
            titulo.destroy();
            lista.destroy();
            cerrar.destroy();
        });

        this.input.keyboard.once('keydown-ESC', () => {
            overlay.destroy();
            titulo.destroy();
            lista.destroy();
            cerrar.destroy();
        });
    }
}