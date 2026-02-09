export default class AuthScene extends Phaser.Scene {
  constructor() {
    super('AuthScene');
  }

  create() {
    fetch("/php/login.php")
      .then(res => res.json())
      .then(data => {
        if (data.logged) {
          this.scene.start(data.scene, data);
        } else {
          this.scene.start("LoginScene");
        }
      })
      .catch(() => {
        this.scene.start("LoginScene");
      });
  }
}
