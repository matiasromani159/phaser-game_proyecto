export default class AICompanionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AICompanionScene' });
    }

    init(data) {
        this.parentScene = data.parentScene || null;
        this.gemini = data.geminiService || null;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.isOpen = false;
        this.isTyping = false;
        this.inputText = '';
        this.messages = [];

        this.overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.3)
            .setOrigin(0)
            .setDepth(9000)
            .setInteractive()
            .on('pointerdown', () => this.close())
            .setVisible(false);

        const panelW = 380;
        const panelH = 260;
        const panelX = (W - panelW) / 2;
        const panelY = (H - panelH) / 2;

        this.panel = this.add.container(panelX, panelY).setDepth(9001).setVisible(false);

        const bg = this.add.rectangle(0, 0, panelW, panelH, 0x1a1a2e, 0.95)
            .setOrigin(0)
            .setStrokeStyle(2, 0xff6b9d);
        this.panel.add(bg);

        this.panel.add(
            this.add.text(10, 8, '✦ RALSEI ✦', {
                fontFamily: 'UndertaleFont',
                fontSize: '14px',
                color: '#ff6b9d'
            }).setResolution(10)
        );

        this.messagesContainer = this.add.container(10, 35);
        this.panel.add(this.messagesContainer);

        this.inputDisplay = this.add.text(10, panelH - 45, '> ', {
            fontFamily: 'UndertaleFont',
            fontSize: '12px',
            color: '#ffffff',
            fixedWidth: panelW - 20
        }).setResolution(10);
        this.panel.add(this.inputDisplay);

        this.typingIndicator = this.add.text(10, panelH - 25, '', {
            fontFamily: 'UndertaleFont',
            fontSize: '10px',
            color: '#888888'
        }).setResolution(10).setVisible(false);
        this.panel.add(this.typingIndicator);

        this.instructions = this.add.text(panelX + 10, panelY + panelH + 5,
            '[ENTER] Enviar  |  [ESC] Cerrar  |  [H] Toggle', {
            fontFamily: 'UndertaleFont',
            fontSize: '10px',
            color: '#666666'
        }).setDepth(9001).setVisible(false).setResolution(10);

        // Listener Enter separado para evitar múltiples disparos
        this.input.keyboard.on('keydown-ENTER', () => {
            if (!this.isOpen || this.isTyping) return;
            this._sendMessage();
        }, this);

        // Listener resto de teclas
     this.input.keyboard.on('keydown', (event) => {
    if (!this.isOpen) return;
    
    // Solo cerrar con H si NO estamos escribiendo texto
    if (event.key === 'Escape') {
        this.close();
        return;
    }

    if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
        this._updateInput();
        return;
    }

    if (event.key === 'Enter') return;

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        this.inputText += event.key;
        this._updateInput();
    }
}, this);

        this._addMessage('RALSEI', '¡Oh! Kris... puedo sentir tu presencia. ¿Necesitas ayuda? Presiona H para hablar conmigo.', '#ff6b9d');

        this.isReady = true;
    }

    setGeminiService(service) {
        this.gemini = service;
        console.log('[AICompanionScene] GeminiService conectado correctamente');
    }

    shutdown() {
        this.close();
    }

    _updateInput() {
        this.inputDisplay.setText(`> ${this.inputText}_`);
    }

    async _sendMessage() {
        if (!this.inputText.trim() || this.isTyping) return;
        this.isTyping = true;

        if (!this.gemini) {
            this.isTyping = false;
            this._addMessage('RALSEI', 'Espera un momento Kris...', '#ff6b9d');
            return;
        }

        const message = this.inputText.trim();
        this.inputText = '';
        this._updateInput();

        this._addMessage('KRIS', message, '#4ecdc4');
        this.typingIndicator.setVisible(true);

        const context = this._getGameContext();

        try {
            const response = await this.gemini.ask(message, context);
            this.isTyping = false;
            this.typingIndicator.setVisible(false);
            const color = response.error ? '#ff4444' : '#ff6b9d';
            this._addMessage('RALSEI', response.text, color);
        } catch (error) {
            console.error('[AICompanionScene] Error:', error);
            this.isTyping = false;
            this.typingIndicator.setVisible(false);
            this._addMessage('RALSEI', 'Mmm... algo salió mal.', '#ff4444');
        }
    }

    _addMessage(sender, text, color) {
        const maxMessages = 7;
        const maxWidth = 340;

        const msgText = this.add.text(0, 0, `${sender}: ${text}`, {
            fontFamily: 'UndertaleFont',
            fontSize: '11px',
            color: color,
            wordWrap: { width: maxWidth }
        }).setResolution(10);

        this.messages.push(msgText);
        this.messagesContainer.add(msgText);

        if (this.messages.length > maxMessages) {
            const old = this.messages.shift();
            old.destroy();
        }

        let currentY = 0;
        this.messages.forEach(msg => {
            msg.setY(currentY);
            currentY += msg.height + 4;
        });
    }

    _getGameContext() {
        const parent = this.parentScene;
        if (!parent) return {};

        return {
            room: parent.scene.key,
            hp: parent.player?.vida,
            maxHp: parent.player?.vidaMax,
            items: parent.player?.inventario || [],
            objective: this._getObjective(parent.scene.key)
        };
    }

    _getObjective(room) {
        const objectives = {
            'Room1': 'Explorar la sala inicial',
            'Room19': 'Encontrar la llave y abrir la puerta',
            'BossScene': 'Derrotar a Shadow Mantle',
        };
        return objectives[room] || 'Explorar';
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.overlay.setVisible(true);
        this.panel.setVisible(true);
        this.instructions.setVisible(true);
        this.scene.bringToTop();

        const activeScene = this.game.scene.getScenes(true)[0];
        if (activeScene && activeScene !== this) {
            this.parentScene = activeScene;
        }
    }

    close() {
        this.isOpen = false;
        this.overlay.setVisible(false);
        this.panel.setVisible(false);
        this.instructions.setVisible(false);
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    update() {
        if (this.isTyping) {
            const dots = ['', '.', '..', '...'];
            const frame = Math.floor(this.time.now / 500) % 4;
            this.typingIndicator.setText(`Ralsei está escribiendo${dots[frame]}`);
        }
    }
}