import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { LaneManager } from './LaneManager';
import { Collectible } from './Collectible';

export class CollectibleSpawner {
  private scene: Phaser.Scene;
  private laneManager: LaneManager;
  private group: Phaser.Physics.Arcade.Group;

  private isSpawning: boolean = false;
  private spawnTimer: number = 0;
  private currentInterval: number = 800;
  private currentSpeed: number = 280;

  public onCollected?: (value: number) => void;
  public onMissed?: (value: number) => void;

  constructor(scene: Phaser.Scene, laneManager: LaneManager, group: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.laneManager = laneManager;
    this.group = group;
  }

  public start() {
    this.isSpawning = true;
    this.spawnTimer = 200;
    this.spawnOne();
  }

  public stop() {
    this.isSpawning = false;
  }

  public clearAll() {
    this.group.clear(true, true);
  }

  private updateDifficulty(elapsedSec: number) {
    for (const tier of GAME_CONFIG.DIFFICULTY_TIERS) {
      if (elapsedSec <= tier.upToSec) {
        this.currentInterval = Math.max(600, tier.spawnIntervalMs - 200);
        this.currentSpeed = tier.speed;
        return;
      }
    }
    const lastTier = GAME_CONFIG.DIFFICULTY_TIERS[GAME_CONFIG.DIFFICULTY_TIERS.length - 1];
    this.currentInterval = Math.max(550, lastTier.spawnIntervalMs - 150);
    this.currentSpeed = lastTier.speed;
  }

  public update(delta: number, elapsedSec: number) {
    if (!this.isSpawning) return;

    this.updateDifficulty(elapsedSec);

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.currentInterval) {
      this.spawnTimer = 0;
      this.spawnOne();
    }

    const items = this.group.getChildren() as Collectible[];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.update(delta);

      if (item.isOffScreen(GAME_CONFIG.CANVAS_HEIGHT)) {
        this.group.remove(item, true, true);
        if (this.onMissed) {
          this.onMissed(item.getValue());
        }
      }
    }
  }

  private spawnOne() {
    const laneIdx = Phaser.Math.Between(0, GAME_CONFIG.LANE_COUNT - 1);
    const x = this.laneManager.getLaneCenter(laneIdx);
    const y = -40;
    const item = new Collectible(this.scene, x, y, laneIdx, this.currentSpeed);
    this.group.add(item);
  }
}