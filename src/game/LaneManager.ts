import Phaser from 'phaser';
import { LANES, GAME_CONFIG } from '../config/gameConfig';

export class LaneManager {
  private scene: Phaser.Scene;
  private laneWidth: number;
  private laneCenters: number[] = [];
  private graphics!: Phaser.GameObjects.Graphics;
  private activeLaneIndex: number = 1;
  private highlightAlpha: number = 0.12;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.laneWidth = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.LANE_COUNT;

    for (let i = 0; i < GAME_CONFIG.LANE_COUNT; i++) {
      this.laneCenters.push(i * this.laneWidth + this.laneWidth / 2);
    }
  }

  public create() {
    this.graphics = this.scene.add.graphics();
    this.drawLanes();
  }

  public getLaneCenter(laneIndex: number): number {
    const safeIdx = Math.max(0, Math.min(GAME_CONFIG.LANE_COUNT - 1, laneIndex));
    return this.laneCenters[safeIdx];
  }

  public setActiveLane(laneIndex: number) {
    this.activeLaneIndex = laneIndex;
    this.drawLanes();
  }

  public drawLanes() {
    this.graphics.clear();

    const w = GAME_CONFIG.CANVAS_WIDTH;
    const h = GAME_CONFIG.CANVAS_HEIGHT;

    // Warm Obsidian Background
    this.graphics.fillGradientStyle(0x1a1917, 0x1a1917, 0x121110, 0x121110, 1);
    this.graphics.fillRect(0, 0, w, h);

    // Draw Lane Dividers & Soft Glow
    for (let i = 0; i < GAME_CONFIG.LANE_COUNT; i++) {
      const x = i * this.laneWidth;
      const laneInfo = LANES[i];

      // Subtle warm divider lines
      if (i > 0) {
        this.graphics.lineStyle(1.2, 0x36342e, 0.7);
        this.graphics.lineBetween(x, 0, x, h);
      }

      // Highlight active lane
      if (i === this.activeLaneIndex) {
        this.graphics.fillStyle(laneInfo.glowColor, this.highlightAlpha);
        this.graphics.fillRect(x, 0, this.laneWidth, h);

        // Bottom warm accent bar
        this.graphics.fillStyle(laneInfo.glowColor, 0.85);
        this.graphics.fillRect(x + 12, h - 6, this.laneWidth - 24, 4);
      } else {
        // Subtle base marker
        this.graphics.fillStyle(0x36342e, 0.4);
        this.graphics.fillRect(x + 16, h - 4, this.laneWidth - 32, 2);
      }
    }

    // Outer warm border
    this.graphics.lineStyle(1.5, 0x3a3832, 0.8);
    this.graphics.strokeRect(1, 1, w - 2, h - 2);
  }
}
