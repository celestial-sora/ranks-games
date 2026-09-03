import Phaser from 'phaser';
import { LANES } from '../config/gameConfig';

export class Collectible extends Phaser.GameObjects.Container {
  private readonly laneIndex: number;
  private readonly speed: number;
  private readonly value: number;

  private spark!: Phaser.GameObjects.Graphics;
  private pulseTimer: number = 0;

  public onCollected?: (value: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, laneIndex: number, speed: number) {
    super(scene, x, y);

    this.laneIndex = laneIndex;
    this.speed = speed;
    this.value = speed <= 340 ? 10 : speed <= 460 ? 20 : 40;

    this.createVisuals();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(44, 44);
      body.setOffset(-22, -22);
    }
  }

  private createVisuals() {
    const laneColor = LANES[this.laneIndex].glowColor;

    this.spark = this.scene.add.graphics();
    this.add(this.spark);
    this.drawSpark(laneColor);
  }

  private drawSpark(accentColor: number) {
    this.spark.clear();

    // Halo glow
    this.spark.fillStyle(accentColor, 0.15);
    this.spark.fillCircle(0, 0, 20);

    // Gem core
    this.spark.fillStyle(accentColor, 1);
    this.spark.fillCircle(0, 0, 9);

    // Diamond facet highlight
    this.spark.fillStyle(0xfaf9f5, 0.9);
    this.spark.fillCircle(-3, -3, 3);

    // Outer ring
    this.spark.lineStyle(1.5, 0xfaf9f5, 0.6);
    this.spark.strokeCircle(0, 0, 13);
  }

  public getValue(): number {
    return this.value;
  }

  public update(delta: number) {
    const dtSec = delta / 1000;
    this.y += this.speed * dtSec;

    // Gentle pulse animation
    this.pulseTimer += delta;
    const s = 1 + Math.sin(this.pulseTimer / 200) * 0.12;
    this.setScale(s, s);
    this.spark.setRotation(this.pulseTimer / 500);
  }

  public isOffScreen(sceneHeight: number): boolean {
    return this.y > sceneHeight + 60;
  }
}