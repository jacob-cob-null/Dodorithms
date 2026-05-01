import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    this.add.text(16, 580, "UI scene online", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#94a3b8",
    });
  }
}
