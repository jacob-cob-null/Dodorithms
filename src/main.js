import Phaser from "phaser";
import "./style.css";
import BootScene        from "./scenes/BootScene.js";
import MainMenuScene    from "./scenes/MainMenuScene.js";
import GameScene        from "./scenes/GameScene.js";
import UIScene          from "./scenes/UIScene.js";
import ShatteredPad     from "./minigames/ShatteredPad.js";
import GuestList        from "./minigames/GuestList.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 800,
  height: 600,
  backgroundColor: "#0d1117",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene, ShatteredPad, GuestList],
};

new Phaser.Game(config);
