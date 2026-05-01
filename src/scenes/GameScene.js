import Phaser from "phaser";
import Player from "../entities/Player.js";
import NPC from "../entities/NPC.js";
import Interactable from "../entities/Interactable.js";
import PlayerController from "../systems/PlayerController.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import PuzzleSystem, { Puzzle } from "../systems/PuzzleSystem.js";
import EventBus from "../systems/EventBus.js";
import { EVENTS } from "../systems/events.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);

    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "platform").setScale(12.5, 2).refreshBody();

    this.player = new Player(this, 120, 450);
    this.physics.add.collider(this.player, this.platforms);
    this.playerController = new PlayerController(this, this.player);

    this.interactionSystem = new InteractionSystem(this, this.player);
    const npc = new NPC(this, 420, 500, {
      id: "npc-1",
      lines: ["Hey there, hatchling!", "Tap E to chat about algorithms."],
    });
    this.interactionSystem.register(npc);

    this.puzzleSystem = new PuzzleSystem();
    const euclidPuzzle = new Puzzle({
      id: "euclid",
      name: "Euclid's Algorithm",
      description: "Find the GCD of two numbers.",
    });
    const puzzleNode = new Interactable(this, 620, 520, "interactable", {
      id: "puzzle-1",
      type: "puzzle",
      data: { puzzle: euclidPuzzle },
      onInteract: () => this.puzzleSystem.launch(euclidPuzzle),
    });
    this.interactionSystem.register(puzzleNode);

    EventBus.on(EVENTS.START_DIALOGUE, () => {
      this.playerController.setEnabled(false);
      this.interactionSystem.setEnabled(false);
    });

    EventBus.on(EVENTS.END_DIALOGUE, () => {
      this.playerController.setEnabled(true);
      this.interactionSystem.setEnabled(true);
    });

    this.add.text(16, 16, "Dodorithmic: scaffold", {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#e2e8f0",
    });
  }

  update() {
    this.playerController.update();
    this.interactionSystem.update();
  }
}
