import Phaser from "phaser";
import "./style.css";
import BootScene        from "./scenes/BootScene.js";
import MainMenuScene    from "./scenes/MainMenuScene.js";
import GameScene        from "./scenes/GameScene.js";
import UIScene          from "./scenes/UIScene.js";
import ShatteredPad     from "./minigames/ShatteredPad.js";
import GuestList        from "./minigames/GuestList.js";
import ConsecutiveInt      from "./minigames/ConsecutiveInt.js";
import MiddleSchool        from "./minigames/MiddleSchool.js";
import SequentialSearch    from "./minigames/SequentialSearch.js";
import MaxElement          from "./minigames/MaxElement.js";
import ExhaustiveSearch    from "./minigames/ExhaustiveSearch.js";
import SelectionSort       from "./minigames/SelectionSort.js";
import BubbleSort          from "./minigames/BubbleSort.js";
import BiologicalClearance from "./minigames/BiologicalClearance.js";
import InsertionSort          from "./minigames/InsertionSort.js";
import DFS                    from "./minigames/DFS.js";
import HyperTrain             from "./minigames/HyperTrain.js";
import BinarySearch           from "./minigames/BinarySearch.js";
import InterpolationSearch    from "./minigames/InterpolationSearch.js";
import QuickSort              from "./minigames/QuickSort.js";
import IntergalacticCensus    from "./minigames/IntergalacticCensus.js";
import HeapPriority           from "./minigames/HeapPriority.js";
import PreSort                from "./minigames/PreSort.js";
import ChangeMaking           from "./minigames/ChangeMaking.js";
import CargoGrid              from "./minigames/CargoGrid.js";
import SpanningTree           from "./minigames/SpanningTree.js";
import HuffmanCode            from "./minigames/HuffmanCode.js";
import ServerRouting          from "./minigames/ServerRouting.js";
import QueenGrid              from "./minigames/QueenGrid.js";
import RouteOptimizer         from "./minigames/RouteOptimizer.js";
import ComplexityGate         from "./minigames/ComplexityGate.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 800,
  height: 600,
  backgroundColor: "#0d1117",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene, ShatteredPad, GuestList, ConsecutiveInt, MiddleSchool, SequentialSearch, MaxElement, ExhaustiveSearch, SelectionSort, BubbleSort, BiologicalClearance, InsertionSort, DFS, HyperTrain, BinarySearch, InterpolationSearch, QuickSort, IntergalacticCensus, HeapPriority, PreSort, ChangeMaking, CargoGrid, SpanningTree, HuffmanCode, ServerRouting, QueenGrid, RouteOptimizer, ComplexityGate],
};

new Phaser.Game(config);
