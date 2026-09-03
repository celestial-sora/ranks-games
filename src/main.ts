import './style.css';
import Phaser from 'phaser';
import { GAME_CONFIG } from './config/gameConfig';
import { GameScene } from './game/GameScene';
import { TeachableMachineService } from './ai/TeachableMachineService';
import { UIManager } from './ui/UIManager';

// Main Application Bootstrapper
class App {
  private game!: Phaser.Game;
  private gameScene!: GameScene;
  private aiService: TeachableMachineService;
  private ui: UIManager;

  public getGame(): Phaser.Game {
    return this.game;
  }

  private currentHp: number = GAME_CONFIG.MAX_HP;
  private currentScore: number = 0;
  private currentTimeSec: number = 0;

  constructor() {
    this.aiService = TeachableMachineService.getInstance();
    this.ui = UIManager.getInstance();
  }

  public init() {
    // 1. Build DOM UI
    this.ui.init('app');

    // 2. Initialize Phaser Game
    this.gameScene = new GameScene();
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-mount',
      width: GAME_CONFIG.CANVAS_WIDTH,
      height: GAME_CONFIG.CANVAS_HEIGHT,
      backgroundColor: '#1a1917',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [this.gameScene]
    };

    this.game = new Phaser.Game(config);

    // 3. Connect Scene Callbacks
    this.gameScene.onHpChanged = (hp, maxHp) => {
      this.currentHp = hp;
      this.ui.updateHUD(this.currentHp, maxHp, this.currentScore, this.currentTimeSec);
    };

    this.gameScene.onScoreChanged = (score) => {
      this.currentScore = score;
      this.ui.updateHUD(this.currentHp, GAME_CONFIG.MAX_HP, this.currentScore, this.currentTimeSec);
    };

    this.gameScene.onTimeChanged = (timeSec) => {
      this.currentTimeSec = timeSec;
      this.ui.updateHUD(this.currentHp, GAME_CONFIG.MAX_HP, this.currentScore, this.currentTimeSec);
    };

    this.gameScene.onStateChanged = (state, data) => {
      if (state === 'GAME_OVER' && data) {
        this.aiService.setGameplayActive(false);
        this.ui.showGameOver(data.score, data.timeSec);
      } else if (state === 'VICTORY' && data) {
        this.aiService.setGameplayActive(false);
        this.ui.showVictory(data.score, data.timeSec);
      }
    };

    // 4. Connect AI Callbacks
    this.aiService.onLaneDetected = (laneIndex, label, _confidence) => {
      console.log(`[AI Detected] Lane ${laneIndex + 1} (${label})`);
      this.gameScene.setPlayerLane(laneIndex);
    };

    this.aiService.onPredictionUpdate = (preds, topLabel, topProb, targetLane) => {
      this.ui.updateTelemetry(preds, topLabel, topProb, targetLane);
    };

    this.aiService.onStatusChange = (status, error) => {
      this.ui.updateAIStatus(status);
      if (status === 'error' && error) {
        this.ui.showLoadingError(error);
      }
    };

    // 5. Connect UI Action Callbacks
    this.ui.onStartClicked = async () => {
      this.ui.showLoadingScreen('Connecting to camera & AI model...');
      const success = await this.aiService.initialize(this.ui.getWebcamContainer());
      if (success) {
        this.ui.showTutorialScreen();
      }
    };

    this.ui.onTutorialFinished = () => {
      this.aiService.setGameplayActive(true);
      this.ui.startCountdown(() => {
        this.currentHp = GAME_CONFIG.MAX_HP;
        this.currentScore = 0;
        this.currentTimeSec = 0;
        this.ui.updateHUD(this.currentHp, GAME_CONFIG.MAX_HP, 0, 0);
        this.gameScene.startCountdownAndPlay();
      });
    };

    this.ui.onPlayAgainClicked = () => {
      this.aiService.setGameplayActive(true);
      this.ui.startCountdown(() => {
        this.currentHp = GAME_CONFIG.MAX_HP;
        this.currentScore = 0;
        this.currentTimeSec = 0;
        this.ui.updateHUD(this.currentHp, GAME_CONFIG.MAX_HP, 0, 0);
        this.gameScene.startCountdownAndPlay();
      });
    };

    this.ui.onMenuClicked = () => {
      this.gameScene.resetGame();
      this.ui.showStartScreen();
    };

    this.ui.onManualLaneSelected = (lane) => {
      this.gameScene.setPlayerLane(lane);
      this.aiService.triggerManualLane(lane);
    };

    // Proactively initialize webcam in background so preview starts right away if permissions exist
    setTimeout(() => {
      this.aiService.initialize(this.ui.getWebcamContainer()).catch(() => {
        // Silently wait for user to click Start if browser requires click
      });
    }, 500);
  }
}

// Start on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
