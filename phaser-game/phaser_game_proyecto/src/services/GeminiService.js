export default class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.history = [];
        this.isAvailable = !!apiKey;
        this.lastRequestTime = 0;
        this.cooldownMs = 3000;
    }

    async ask(playerMessage, gameContext = {}, retries = 2) {
        if (!this.isAvailable) return { text: "IA no disponible.", error: true };

        const now = Date.now();
        if (now - this.lastRequestTime < this.cooldownMs) {
            const remaining = Math.ceil((this.cooldownMs - (now - this.lastRequestTime)) / 1000);
            return { text: `Espera ${remaining} segundos, Kris...`, error: false };
        }
        this.lastRequestTime = now;

        const systemPrompt = this._buildSystemPrompt(gameContext);

        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.history.slice(-6),
            { role: 'user', content: playerMessage }
        ];

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages,
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            if (response.status === 429 && retries > 0) {
                console.warn('[GroqService] 429, reintentando...');
                await new Promise(r => setTimeout(r, 5000));
                return this.ask(playerMessage, gameContext, retries - 1);
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "No entendí...";

            this.history.push({ role: 'user', content: playerMessage });
            this.history.push({ role: 'assistant', content: text });
            if (this.history.length > 20) this.history = this.history.slice(-20);

            return { text, error: false };

        } catch (err) {
            console.error('[GroqService] Error:', err);
            return { text: `Error: ${err.message}`, error: true };
        }
    }

    _buildSystemPrompt(context) {
        const { room, hp, maxHp, items, objective } = context;
        return `Eres RALSEI, príncipe oscuro amable de Deltarune. Ayudas a Kris.

REGLAS:
- Responde en español, tono dulce, 2-3 frases máximo.
- No rompas la cuarta pared.
- Da pistas sutiles, NO spoilers.

CONTEXTO:
- Ubicación: ${room || 'Desconocida'}
- Vida: ${hp || '??'}/${maxHp || '??'}
- Items: ${items?.join(', ') || 'Ninguno'}
- Objetivo: ${objective || 'Explorar'}`;
    }

    clearHistory() { this.history = []; }
}