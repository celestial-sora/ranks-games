import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { LaneManager } from './LaneManager';
import { Player } from './Player';
import { ObstacleSpawner } from './ObstacleSpawner';
import { Obstacle } from './Obstacle';
import { SoundManager } from '../audio/SoundManager';

export type GameState = 'START' | 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';

export class GameScene extends Phaser.Scene {
  private laneManager!: LaneManager;
  private player!: Player;
  private obstacleSpawner!: ObstacleSpawner;
  private obstaclesGroup!: Phaser.Physics.Arcade.Group;

  private gameState: GameState = 'START';
  private survivalTimeSec: number = 0;
  private score: number = 0;
  private scoreTimer: number = 0;

  // Gentle starlight particles
  private stars: Array<{ x: number; y: number; speed: number; size: number; alpha: number }> = [];
  private starGfx!: Phaser.GameObjects.Graphics;

  // Callbacks to UI
  public onStateChanged?: (state: GameState, data?: { score: number; timeSec: number }) => void;
  public onScoreChanged?: (score: number) => void;
  public onTimeChanged?: (timeSec: number) => void;
  public onHpChanged?: (hp: number, maxHp: number) => void;
  public onLaneChanged?: (lane: number) => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create() {
    // Warm Starlight Field
    this.starGfx = this.add.graphics();
    for (let i = 0; i < 35; i++) {
      this.stars.push({
        x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
        y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
        speed: 30 + Math.random() * 80,
        size: Math.random() < 0.8 ? 1.5 : 2.5,
        alpha: 0.3 + Math.random() * 0.5
      });
    }

    // Lane Manager (3 Lanes)
    this.laneManager = new LaneManager(this);
    this.laneManager.create();

    // Physics Group for Obstacles
    this.obstaclesGroup = this.physics.add.group();

    // Obstacle Spawner
    this.obstacleSpawner = new ObstacleSpawner(this, this.laneManager, this.obstaclesGroup);
    this.obstacleSpawner.onObstacleDodged = () => {
      if (this.gameState === 'PLAYING') {
        this.addScore(GAME_CONFIG.SCORE_DODGE_BONUS);
      }
    };

    // Player (Starts at Middle Lane)
    const playerY = GAME_CONFIG.CANVAS_HEIGHT - 80;
    const initialLane = 1;
    const playerX = this.laneManager.getLaneCenter(initialLane);

    this.player = new Player(this, playerX, playerY);
    this.player.onHpChanged = (hp, maxHp) => {
      if (this.onHpChanged) {
        this.onHpChanged(hp, maxHp);
      }
      if (hp <= 0 && this.gameState === 'PLAYING') {
        this.triggerGameOver();
      }
    };

    this.player.onHit = () => {
      this.cameras.main.shake(180, 0.012);
      this.spawnHitParticles(this.player.x, this.player.y);
    };

    this.setupKeyboardControls();
  }

  private setupKeyboardControls() {
    if (!this.input || !this.input.keyboard) return;

    this.input.keyboard.on('keydown-ONE', () => this.setPlayerLane(0));
    this.input.keyboard.on('keydown-TWO', () => this.setPlayerLane(1));
    this.input.keyboard.on('keydown-THREE', () => this.setPlayerLane(2));

    this.input.keyboard.on('keydown-A', () => this.setPlayerLane(0));
    this.input.keyboard.on('keydown-S', () => this.setPlayerLane(1));
    this.input.keyboard.on('keydown-D', () => this.setPlayerLane(2));

    this.input.keyboard.on('keydown-LEFT', () => {
      const cur = this.player.getLane();
      if (cur > 0) this.setPlayerLane(cur - 1);
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      const cur = this.player.getLane();
      if (cur < GAME_CONFIG.LANE_COUNT - 1) this.setPlayerLane(cur + 1);
    });
  }

  public setPlayerLane(laneIndex: number) {
    if (this.gameState !== 'PLAYING' && this.gameState !== 'COUNTDOWN') return;

    const clampedLane = Math.max(0, Math.min(GAME_CONFIG.LANE_COUNT - 1, laneIndex));
    const targetX = this.laneManager.getLaneCenter(clampedLane);
    this.player.setTargetLane(clampedLane, targetX);
    this.laneManager.setActiveLane(clampedLane);

    if (this.onLaneChanged) {
      this.onLaneChanged(clampedLane);
    }
  }

  public startCountdownAndPlay() {
    this.resetGame();
    this.gameState = 'PLAYING';
    this.obstacleSpawner.start();

    if (this.onStateChanged) {
      this.onStateChanged('PLAYING');
    }
  }

  public resetGame() {
    this.survivalTimeSec = 0;
    this.score = 0;
    this.scoreTimer = 0;

    const initialLane = 1;
    const initialX = this.laneManager.getLaneCenter(initialLane);
    this.player.reset(initialX);
    this.laneManager.setActiveLane(initialLane);
    this.obstacleSpawner.clearAll();

    if (this.onScoreChanged) this.onScoreChanged(this.score);
    if (this.onTimeChanged) this.onTimeChanged(this.survivalTimeSec);
    if (this.onHpChanged) this.onHpChanged(GAME_CONFIG.MAX_HP, GAME_CONFIG.MAX_HP);
  }

  private addScore(amount: number) {
    this.score += amount;
    if (this.onScoreChanged) {
      this.onScoreChanged(this.score);
    }
  }

  private triggerGameOver() {
    this.gameState = 'GAME_OVER';
    this.obstacleSpawner.stop();
    SoundManager.getInstance().playGameOver();

    if (this.onStateChanged) {
      this.onStateChanged('GAME_OVER', {
        score: this.score,
        timeSec: Math.floor(this.survivalTimeSec)
      });
    }
  }

  private triggerVictory() {
    this.gameState = 'VICTORY';
    this.obstacleSpawner.stop();
    SoundManager.getInstance().playVictory();

    if (this.onStateChanged) {
      this.onStateChanged('VICTORY', {
        score: this.score,
        timeSec: Math.floor(this.survivalTimeSec)
      });
    }
  }

  private spawnHitParticles(x: number, y: number) {
    const emitter = this.add.particles(x, y, undefined as unknown as string, {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      quantity: 16,
      emitting: false
    });
    emitter.explode(16);
    this.time.delayedCall(450, () => emitter.destroy());
  }

  public update(_time: number, delta: number) {
    const dtSec = delta / 1000;

    // Update Warm Starlight
    this.starGfx.clear();
    for (const s of this.stars) {
      s.y += s.speed * dtSec;
      if (s.y > GAME_CONFIG.CANVAS_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
      }
      this.starGfx.fillStyle(0xe5a86a, s.alpha);
      this.starGfx.fillCircle(s.x, s.y, s.size);
    }

    if (this.gameState === 'PLAYING') {
      this.player.update(delta);
      this.obstacleSpawner.update(delta, this.survivalTimeSec);

      // Distance Collision Check
      const obstacles = this.obstaclesGroup.getChildren() as Obstacle[];
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obs.x, obs.y);
        if (dist < 40) {
          const damaged = this.player.takeDamage();
          if (damaged) {
            this.spawnHitParticles(obs.x, obs.y);
            this.obstaclesGroup.remove(obs, true, true);
          }
        }
      }

      this.survivalTimeSec += dtSec;
      this.scoreTimer += delta;
      if (this.scoreTimer >= 1000) {
        this.scoreTimer -= 1000;
        this.addScore(GAME_CONFIG.SCORE_PER_SECOND);
        if (this.onTimeChanged) {
          this.onTimeChanged(Math.floor(this.survivalTimeSec));
        }
      }

      if (this.survivalTimeSec >= GAME_CONFIG.GAME_DURATION_SEC) {
        this.triggerVictory();
      }
    }
  }
}
