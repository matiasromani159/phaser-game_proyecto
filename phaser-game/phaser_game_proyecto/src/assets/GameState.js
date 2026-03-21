// ─────────────────────────────────────────────────────────────
// GameState.js — Estado global del jugador compartido entre escenas
// Importa este archivo en player.js, GameOverScene y cualquier
// escena que necesite leer o modificar la vida del jugador.
// ─────────────────────────────────────────────────────────────
const GameState = {
    playerHP:    100,
    playerHPMax: 100,
};

export default GameState;