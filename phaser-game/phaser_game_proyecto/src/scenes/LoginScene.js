export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    create() {
        // Mostrar UI de login (HTML)
        const ui = document.getElementById("loginUI");
        ui.style.display = "block";

        document.getElementById("loginBtn").onclick = () => {
            const username = document.getElementById("user").value;
            const password = document.getElementById("pass").value;

            fetch("/php/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.logged) {
                    ui.style.display = "none";      // ocultar login
                    this.scene.start(data.scene, data); // entrar al juego
                } else {
                    alert("Login incorrecto");
                }
            });
        };
    }

    shutdown() {
        // Ocultar UI al salir
        document.getElementById("loginUI").style.display = "none";
    }
}
