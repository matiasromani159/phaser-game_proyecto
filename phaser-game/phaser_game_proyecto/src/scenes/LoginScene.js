// LoginScene.js — Rediseñada completamente en Phaser (sin HTML externo)
// Estilo Deltarune/Undertale: fondo oscuro, fuente del juego, cuadros animados
// Soporta LOGIN y REGISTRO desde la misma scene

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    // ─── Preload de assets necesarios ────────────────────────────
    preload() {
        // Fuente bitmap de Undertale (debe estar ya cargada en el boot o aquí)
        // Si ya la cargas en otra scene, puedes quitar estas líneas
        // this.load.bitmapFont('undertale', '...', '...');

        // Sonidos de UI (reutiliza los del juego si ya están en caché)
        if (!this.cache.audio.has('snd_board_text_main')) {
            this.load.audio('snd_board_text_main', '/src/assets/sounds/snd_board_text_main.wav');
        }
        if (!this.cache.audio.has('snd_save')) {
            this.load.audio('snd_save', '/src/assets/sounds/snd_save.wav');
        }
        if (!this.cache.audio.has('snd_power')) {
            this.load.audio('snd_power', '/src/assets/sounds/snd_power.wav');
        }
    }

    // ─── Estado de la scene ───────────────────────────────────────
    create() {
        this.mode = 'login';          // 'login' | 'register'
        this.activeField = 'user';    // 'user' | 'pass' | 'pass2'
        this.inputValues = { user: '', pass: '', pass2: '' };
        this.cursorVisible = true;
        this.isLoading = false;
        this.errorMessage = '';

        const W = this.scale.width;
        const H = this.scale.height;

        // ── Fondo ────────────────────────────────────────────────
        this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0, 0);

        // Estrellas de fondo (decorativas, estilo Deltarune)
        this._crearEstrellas(W, H);

        // ── Contenedor central ───────────────────────────────────
        this.containerY = H / 2;

        // Caja exterior (borde blanco al estilo Undertale)
        this.cajaExterior = this.add.rectangle(W / 2, H / 2, 340, 280, 0x000000)
            .setStrokeStyle(3, 0xffffff)
            .setOrigin(0.5);

        // Título
        this.titulo = this.add.text(W / 2, H / 2 - 118, '* Bienvenido', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '18px',
            color: '#ffffff',
            resolution: 10
        }).setOrigin(0.5);

        // ── Campos de entrada ────────────────────────────────────
        const labelX = W / 2 - 150;
        const fieldX = W / 2;

        // Label "Usuario"
        this.labelUser = this.add.text(labelX, H / 2 - 72, 'NOMBRE:', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '14px',
            color: '#ffffff',
            resolution: 10
        }).setOrigin(0, 0.5);

        // Caja usuario
        this.cajaUser = this.add.rectangle(fieldX + 30, H / 2 - 72, 200, 26, 0x000000)
            .setStrokeStyle(2, 0xffffff).setOrigin(0.5);

        this.textoUser = this.add.text(fieldX - 65, H / 2 - 72, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '13px',
            color: '#ffff00',
            resolution: 10
        }).setOrigin(0, 0.5);

        // Label "Contraseña"
        this.labelPass = this.add.text(labelX, H / 2 - 32, 'CONTRASEÑA:', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '14px',
            color: '#ffffff',
            resolution: 10
        }).setOrigin(0, 0.5);

        // Caja contraseña
        this.cajaPass = this.add.rectangle(fieldX + 30, H / 2 - 32, 200, 26, 0x000000)
            .setStrokeStyle(2, 0xffffff).setOrigin(0.5);

        this.textoPass = this.add.text(fieldX - 65, H / 2 - 32, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '13px',
            color: '#ffff00',
            resolution: 10
        }).setOrigin(0, 0.5);

        // Caja "repetir contraseña" (solo en modo registro)
        this.labelPass2 = this.add.text(labelX, H / 2 + 8, 'REPETIR:', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '14px',
            color: '#ffffff',
            resolution: 10
        }).setOrigin(0, 0.5).setVisible(false);

        this.cajaPass2 = this.add.rectangle(fieldX + 30, H / 2 + 8, 200, 26, 0x000000)
            .setStrokeStyle(2, 0xffffff).setOrigin(0.5).setVisible(false);

        this.textoPass2 = this.add.text(fieldX - 65, H / 2 + 8, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '13px',
            color: '#ffff00',
            resolution: 10
        }).setOrigin(0, 0.5).setVisible(false);

        // ── Botones ──────────────────────────────────────────────
        const btnY = H / 2 + 55;

        // Corazón selector (como en Undertale)
        this.corazon = this.add.text(W / 2 - 80, btnY, '♥', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '16px',
            color: '#ff0000',
            resolution: 10
        }).setOrigin(0.5);

        this.btnAceptar = this.add.text(W / 2 - 40, btnY, 'INICIAR', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '16px',
            color: '#ffffff',
            resolution: 10
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        this.btnCambiarModo = this.add.text(W / 2 + 50, btnY, 'REGISTRAR', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '14px',
            color: '#888888',
            resolution: 10
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        // ── Mensaje de error / estado ────────────────────────────
        this.textoError = this.add.text(W / 2, H / 2 + 90, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '12px',
            color: '#ff6060',
            resolution: 10,
            wordWrap: { width: 300 }
        }).setOrigin(0.5);

        // ── Texto de carga ───────────────────────────────────────
        this.textoCargando = this.add.text(W / 2, H / 2 + 110, '', {
            fontFamily: 'UndertaleFont, monospace',
            fontSize: '12px',
            color: '#aaaaaa',
            resolution: 10
        }).setOrigin(0.5);

        // ── Cursor parpadeante ───────────────────────────────────
        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => { this.cursorVisible = !this.cursorVisible; this._actualizarTextos(); }
        });

        // ── Input del teclado ────────────────────────────────────
        this._configurarTeclado();

        // ── Hover en botones ─────────────────────────────────────
        this.btnAceptar.on('pointerover', () => this.btnAceptar.setColor('#ffff00'));
        this.btnAceptar.on('pointerout', () => this.btnAceptar.setColor('#ffffff'));
        this.btnAceptar.on('pointerdown', () => this._enviar());

        this.btnCambiarModo.on('pointerover', () => this.btnCambiarModo.setColor('#ffffff'));
        this.btnCambiarModo.on('pointerout', () => this.btnCambiarModo.setColor('#888888'));
        this.btnCambiarModo.on('pointerdown', () => this._cambiarModo());

        // Clic en cajas para seleccionar campo
        this.cajaUser.setInteractive().on('pointerdown', () => this._seleccionarCampo('user'));
        this.cajaPass.setInteractive().on('pointerdown', () => this._seleccionarCampo('pass'));
        this.cajaPass2.setInteractive().on('pointerdown', () => this._seleccionarCampo('pass2'));

        // Animación de entrada
        this._animarEntrada();

        // Actualiza el estado visual inicial
        this._actualizarUI();
    }

    // ─── Estrellas de fondo ───────────────────────────────────────
    _crearEstrellas(W, H) {
        const graphics = this.add.graphics();
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, W);
            const y = Phaser.Math.Between(0, H);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillRect(x, y, size, size);
        }

        // Algunas estrellas parpadean
        this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => { graphics.alpha = Phaser.Math.FloatBetween(0.6, 1.0); }
        });
    }

    // ─── Animación de entrada ─────────────────────────────────────
    _animarEntrada() {
        const elementos = [
            this.cajaExterior, this.titulo, this.labelUser, this.cajaUser,
            this.textoUser, this.labelPass, this.cajaPass, this.textoPass,
            this.btnAceptar, this.btnCambiarModo, this.corazon
        ];
        elementos.forEach(e => { e.setAlpha(0); });
        this.tweens.add({
            targets: elementos,
            alpha: 1,
            duration: 600,
            ease: 'Linear',
            delay: 100
        });
    }

    // ─── Selección de campo activo ────────────────────────────────
    _seleccionarCampo(campo) {
        if (this.mode === 'login' && campo === 'pass2') return;
        this.activeField = campo;
        this._actualizarUI();
    }

    // ─── Configuración del teclado ────────────────────────────────
    _configurarTeclado() {
        this._onKeyDown = (event) => {
            if (this.isLoading) return;

            const key = event.key;

            if (key === 'Enter') {
                // Tab entre campos o enviar
                if (this.activeField === 'user') {
                    this._seleccionarCampo('pass');
                } else if (this.activeField === 'pass' && this.mode === 'register') {
                    this._seleccionarCampo('pass2');
                } else {
                    this._enviar();
                }
                return;
            }

            if (key === 'Tab') {
                event.preventDefault();
                if (this.activeField === 'user') this._seleccionarCampo('pass');
                else if (this.activeField === 'pass') {
                    if (this.mode === 'register') this._seleccionarCampo('pass2');
                    else this._seleccionarCampo('user');
                }
                else this._seleccionarCampo('user');
                return;
            }

            if (key === 'Backspace') {
                if (this.inputValues[this.activeField].length > 0) {
                    this.inputValues[this.activeField] = this.inputValues[this.activeField].slice(0, -1);
                    this._actualizarTextos();
                }
                return;
            }

            if (key === 'Escape') {
                this._cambiarModo();
                return;
            }

            // Solo caracteres imprimibles, límite 20
            if (key.length === 1 && this.inputValues[this.activeField].length < 20) {
                this.inputValues[this.activeField] += key;
                this._actualizarTextos();
                if (this.cache.audio.has('snd_board_text_main')) {
                    this.sound.play('snd_board_text_main', { volume: 0.3 });
                }
            }
        };

        window.addEventListener('keydown', this._onKeyDown);
    }

    // ─── Actualizar textos visibles ───────────────────────────────
    _actualizarTextos() {
        const cursor = this.cursorVisible ? '_' : ' ';

        const userDisplay = this.inputValues.user + (this.activeField === 'user' ? cursor : '');
        this.textoUser.setText(userDisplay);

        const passDisplay = '•'.repeat(this.inputValues.pass.length) + (this.activeField === 'pass' ? cursor : '');
        this.textoPass.setText(passDisplay);

        const pass2Display = '•'.repeat(this.inputValues.pass2.length) + (this.activeField === 'pass2' ? cursor : '');
        this.textoPass2.setText(pass2Display);
    }

    // ─── Actualizar estado visual de cajas ────────────────────────
    _actualizarUI() {
        // Resalta la caja activa
        const color_activo = 0xffff00;
        const color_normal = 0xffffff;

        this.cajaUser.setStrokeStyle(2, this.activeField === 'user' ? color_activo : color_normal);
        this.cajaPass.setStrokeStyle(2, this.activeField === 'pass' ? color_activo : color_normal);
        if (this.mode === 'register') {
            this.cajaPass2.setStrokeStyle(2, this.activeField === 'pass2' ? color_activo : color_normal);
        }

        // Modo registro: mostrar tercer campo
        const esRegistro = this.mode === 'register';
        this.labelPass2.setVisible(esRegistro);
        this.cajaPass2.setVisible(esRegistro);
        this.textoPass2.setVisible(esRegistro);

        // Ajustar posición de botones según modo
        const W = this.scale.width;
        const H = this.scale.height;
        const btnY = esRegistro ? H / 2 + 70 : H / 2 + 55;
        this.btnAceptar.setY(btnY);
        this.btnCambiarModo.setY(btnY);
        this.corazon.setY(btnY);

        // Altura de la caja según modo
        this.cajaExterior.setSize(340, esRegistro ? 300 : 280);

        // Textos de botones según modo
        this.btnAceptar.setText(esRegistro ? 'CREAR' : 'INICIAR');
        this.btnCambiarModo.setText(esRegistro ? 'YA TENGO CUENTA' : 'REGISTRAR');

        // Título según modo
        this.titulo.setText(esRegistro ? '* Crear cuenta nueva' : '* Bienvenido');

        this._actualizarTextos();
    }

    // ─── Cambiar entre login y registro ──────────────────────────
    _cambiarModo() {
        this.mode = this.mode === 'login' ? 'register' : 'login';
        this.activeField = 'user';
        this.textoError.setText('');
        this._actualizarUI();

        // Mini animación de transición
        this.tweens.add({
            targets: [this.cajaExterior, this.titulo],
            scaleX: { from: 0.97, to: 1 },
            duration: 150,
            ease: 'Back.Out'
        });
    }

    // ─── Enviar formulario ────────────────────────────────────────
    _enviar() {
        if (this.isLoading) return;

        const username = this.inputValues.user.trim();
        const password = this.inputValues.pass;
        const password2 = this.inputValues.pass2;

        // Validaciones básicas
        if (!username || !password) {
            this._mostrarError('* Rellena todos los campos.');
            return;
        }

        if (this.mode === 'register') {
            if (username.length < 3) {
                this._mostrarError('* El nombre debe tener al menos 3 caracteres.');
                return;
            }
            if (password.length < 4) {
                this._mostrarError('* La contraseña debe tener al menos 4 caracteres.');
                return;
            }
            if (password !== password2) {
                this._mostrarError('* Las contraseñas no coinciden.');
                return;
            }
            this._realizarRegistro(username, password);
        } else {
            this._realizarLogin(username, password);
        }
    }

    // ─── Login ────────────────────────────────────────────────────
    _realizarLogin(username, password) {
        this.isLoading = true;
        this.textoCargando.setText('* Conectando...');
        this.textoError.setText('');

        fetch('/php/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            this.isLoading = false;
            this.textoCargando.setText('');

            if (data.logged) {
                if (this.cache.audio.has('snd_save')) {
                    this.sound.play('snd_save', { volume: 0.8 });
                }
                this._animarExito(() => {
                    this.scene.start(data.scene ?? 'MenuScene', data);
                });
            } else {
                this._mostrarError('* ' + (data.error ?? 'Usuario o contraseña incorrectos.'));
            }
        })
        .catch(() => {
            this.isLoading = false;
            this.textoCargando.setText('');
            this._mostrarError('* Error de conexión. Inténtalo de nuevo.');
        });
    }

    // ─── Registro ─────────────────────────────────────────────────
    _realizarRegistro(username, password) {
        this.isLoading = true;
        this.textoCargando.setText('* Creando cuenta...');
        this.textoError.setText('');

        fetch('/php/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            this.isLoading = false;
            this.textoCargando.setText('');

            if (data.ok) {
                // Registro exitoso → login automático
                if (this.cache.audio.has('snd_power')) {
                    this.sound.play('snd_power', { volume: 0.7 });
                }
                this._mostrarMensajeExito('* ¡Cuenta creada! Iniciando sesión...');
                this.time.delayedCall(1200, () => {
                    this._realizarLogin(username, password);
                });
            } else {
                this._mostrarError('* ' + (data.error ?? 'No se pudo crear la cuenta.'));
            }
        })
        .catch(() => {
            this.isLoading = false;
            this.textoCargando.setText('');
            this._mostrarError('* Error de conexión. Inténtalo de nuevo.');
        });
    }

    // ─── Mostrar error animado ────────────────────────────────────
    _mostrarError(msg) {
        this.textoError.setText(msg).setColor('#ff6060').setAlpha(1);
        // Shake en la caja
        this.tweens.add({
            targets: this.cajaExterior,
            x: { from: this.cajaExterior.x - 5, to: this.cajaExterior.x },
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Linear'
        });
    }

    _mostrarMensajeExito(msg) {
        this.textoError.setText(msg).setColor('#00ff80').setAlpha(1);
    }

    // ─── Animación de éxito al entrar ─────────────────────────────
    _animarExito(callback) {
        this.tweens.add({
            targets: [this.cajaExterior, this.titulo, this.labelUser, this.cajaUser,
                this.textoUser, this.labelPass, this.cajaPass, this.textoPass,
                this.btnAceptar, this.btnCambiarModo, this.corazon, this.textoError],
            alpha: 0,
            duration: 400,
            ease: 'Linear',
            onComplete: callback
        });
    }

    // ─── Limpieza al salir ────────────────────────────────────────
    shutdown() {
        window.removeEventListener('keydown', this._onKeyDown);
    }
}