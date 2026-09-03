import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { LaneManager } from './LaneManager';
import { Player } from './Player';
import { CollectibleSpawner } from './CollectibleSpawner';
import { Collectible } from './Collectible';
import { SoundManager } from '../audio/SoundManager';
import { DevCheat } from '../cheat/DevCheat';

export type GameState = 'START' | 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';

export class GameScene extends Phaser.Scene {
  private laneManager!: LaneManager;
  private player!: Player;
  private collectibleSpawner!: CollectibleSpawner;
  private collectiblesGroup!: Phaser.Physics.Arcade.Group;

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

    // Physics Group for Collectibles
    this.collectiblesGroup = this.physics.add.group();

    // Collectible Spawner
    this.collectibleSpawner = new CollectibleSpawner(this, this.laneManager, this.collectiblesGroup);
    this.collectibleSpawner.onCollected = (value) => {
      if (this.gameState === 'PLAYING') {
        this.addScore(value);
        SoundManager.getInstance().playCoin();
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
    this.collectibleSpawner.start();

    if (this.onStateChanged) {
      this.onStateChanged('PLAYING');
    }
  }

  public isPlaying(): boolean {
    return this.gameState === 'PLAYING';
  }

  public addCheatScore(amount: number) {
    this.addScore(amount);
  }

  public cheatInstantWin() {
    if (!this.isPlaying()) return;
    this.survivalTimeSec = GAME_CONFIG.GAME_DURATION_SEC;
    this.onTimeChanged?.(Math.floor(this.survivalTimeSec));
    this.triggerVictory();
  }

  public resetGame() {
    this.survivalTimeSec = 0;
    this.score = 0;
    this.scoreTimer = 0;

    const initialLane = 1;
    const initialX = this.laneManager.getLaneCenter(initialLane);
    this.player.reset(initialX);
    this.laneManager.setActiveLane(initialLane);
    this.collectibleSpawner.clearAll();

    if (this.onScoreChanged) this.onScoreChanged(this.score);
    if (this.onTimeChanged) this.onTimeChanged(this.survivalTimeSec);
    if (this.onHpChanged) this.onHpChanged(GAME_CONFIG.MAX_HP, GAME_CONFIG.MAX_HP);
  }

  private addScore(amount: number) {
    const multiplier = DevCheat.getInstance().getScoreMultiplier();
    this.score += amount * multiplier;
    if (this.onScoreChanged) {
      this.onScoreChanged(this.score);
    }
  }

  private triggerGameOver() {
    this.gameState = 'GAME_OVER';
    this.collectibleSpawner.stop();
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
    this.collectibleSpawner.stop();
    SoundManager.getInstance().playVictory();

    if (this.onStateChanged) {
      this.onStateChanged('VICTORY', {
        score: this.score,
        timeSec: Math.floor(this.survivalTimeSec)
      });
    }
  }

  private spawnCollectParticles(x: number, y: number, value: number) {
    const color = value >= 40 ? 0xe5a86a : value >= 20 ? 0xd97757 : 0x8fae8b;
    const emitter = this.add.particles(x, y, undefined as unknown as string, {
      speed: { min: 40, max: 140 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 350,
      quantity: 12,
      tint: color,
      emitting: false
    });
    emitter.explode(12);
    this.time.delayedCall(400, () => emitter.destroy());
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
      this.collectibleSpawner.update(delta, this.survivalTimeSec);

      // Distance Collection Check
      const items = this.collectiblesGroup.getChildren() as Collectible[];
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
        if (dist < 44) {
          const value = item.getValue();
          this.collectiblesGroup.remove(item, true, true);
          if (this.collectibleSpawner.onCollected) {
            this.collectibleSpawner.onCollected(value);
            this.spawnCollectParticles(item.x, item.y, value);
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
