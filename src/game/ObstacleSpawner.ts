import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { LaneManager } from './LaneManager';
import { Obstacle, ObstacleType } from './Obstacle';

export class ObstacleSpawner {
  private scene: Phaser.Scene;
  private laneManager: LaneManager;
  private obstaclesGroup: Phaser.Physics.Arcade.Group;

  private isSpawning: boolean = false;
  private spawnTimer: number = 0;
  private currentInterval: number = 1000;
  private currentSpeed: number = 280;
  private multiObstacleProb: number = 0.25;

  public onObstacleDodged?: () => void;

  constructor(scene: Phaser.Scene, laneManager: LaneManager, group: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.laneManager = laneManager;
    this.obstaclesGroup = group;
  }

  public start() {
    this.isSpawning = true;
    this.spawnTimer = 0;
    this.spawnWave(); // Immediate spawn on game start!
  }

  public stop() {
    this.isSpawning = false;
  }

  public clearAll() {
    this.obstaclesGroup.clear(true, true);
  }

  public updateDifficulty(elapsedSec: number) {
    for (const tier of GAME_CONFIG.DIFFICULTY_TIERS) {
      if (elapsedSec <= tier.upToSec) {
        this.currentInterval = tier.spawnIntervalMs;
        this.currentSpeed = tier.speed;
        this.multiObstacleProb = tier.multiObstacleProb;
        return;
      }
    }
    const lastTier = GAME_CONFIG.DIFFICULTY_TIERS[GAME_CONFIG.DIFFICULTY_TIERS.length - 1];
    this.currentInterval = lastTier.spawnIntervalMs;
    this.currentSpeed = lastTier.speed;
    this.multiObstacleProb = lastTier.multiObstacleProb;
  }

  public update(delta: number, elapsedSec: number) {
    if (!this.isSpawning) return;

    this.updateDifficulty(elapsedSec);

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.currentInterval) {
      this.spawnTimer = 0;
      this.spawnWave();
    }

    // Update and cleanup out-of-bounds obstacles
    const obstacles = this.obstaclesGroup.getChildren() as Obstacle[];
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.update(delta);

      if (obs.y > GAME_CONFIG.CANVAS_HEIGHT + 60) {
        this.obstaclesGroup.remove(obs, true, true);
        if (this.onObstacleDodged) {
          this.onObstacleDodged();
        }
      }
    }
  }

  private spawnWave() {
    const types: ObstacleType[] = ['spike', 'plasma', 'cube'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    // For 3 lanes: spawn 1 obstacle, or at most 2 obstacles (1 lane always guaranteed safe!)
    let obstacleCount = 1;
    if (Math.random() < this.multiObstacleProb) {
      obstacleCount = 2; // 2 obstacles, 1 safe lane
    }

    // Pick lanes randomly from available lanes
    const availableLanes = Array.from({ length: GAME_CONFIG.LANE_COUNT }, (_, i) => i);
    Phaser.Utils.Array.Shuffle(availableLanes);

    const chosenLanes = availableLanes.slice(0, obstacleCount);

    for (const laneIdx of chosenLanes) {
      const x = this.laneManager.getLaneCenter(laneIdx);
      const y = -40;
      const obstacle = new Obstacle(this.scene, x, y, laneIdx, this.currentSpeed, chosenType);
      this.obstaclesGroup.add(obstacle);
    }
  }
}
