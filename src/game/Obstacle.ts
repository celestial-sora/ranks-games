import Phaser from 'phaser';

export type ObstacleType = 'spike' | 'plasma' | 'cube';

export class Obstacle extends Phaser.GameObjects.Container {
  public laneIndex: number;
  public speed: number;
  private gfx!: Phaser.GameObjects.Graphics;
  private obsType: ObstacleType;
  private rotSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, laneIndex: number, speed: number, type: ObstacleType = 'plasma') {
    super(scene, x, y);
    this.laneIndex = laneIndex;
    this.speed = speed;
    this.obsType = type;
    this.rotSpeed = (Math.random() - 0.5) * 0.04;

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
    this.gfx = this.scene.add.graphics();
    this.add(this.gfx);

    this.gfx.clear();

    if (this.obsType === 'spike') {
      // Terracotta Prism
      this.gfx.fillStyle(0x36231c, 0.95);
      this.gfx.beginPath();
      this.gfx.moveTo(0, 20);
      this.gfx.lineTo(18, -16);
      this.gfx.lineTo(-18, -16);
      this.gfx.closePath();
      this.gfx.fillPath();

      this.gfx.lineStyle(1.8, 0xd97757, 1);
      this.gfx.strokePath();

      this.gfx.fillStyle(0xfaf9f5, 0.95);
      this.gfx.fillCircle(0, 0, 4);
    } else if (this.obsType === 'cube') {
      // Amber Geometric Diamond
      this.gfx.fillStyle(0x382d1c, 0.9);
      this.gfx.beginPath();
      this.gfx.moveTo(0, -20);
      this.gfx.lineTo(20, 0);
      this.gfx.lineTo(0, 20);
      this.gfx.lineTo(-20, 0);
      this.gfx.closePath();
      this.gfx.fillPath();

      this.gfx.lineStyle(1.8, 0xe5a86a, 1);
      this.gfx.strokePath();

      this.gfx.lineStyle(1, 0xfaf9f5, 0.5);
      this.gfx.lineBetween(-10, 0, 10, 0);
      this.gfx.lineBetween(0, -10, 0, 10);
    } else {
      // Ethereal Sage Orb
      this.gfx.fillStyle(0x8fae8b, 0.18);
      this.gfx.fillCircle(0, 0, 22);

      this.gfx.fillStyle(0x222d21, 0.95);
      this.gfx.fillCircle(0, 0, 16);

      this.gfx.lineStyle(1.8, 0x8fae8b, 1);
      this.gfx.strokeCircle(0, 0, 16);

      this.gfx.fillStyle(0xfaf9f5, 0.9);
      this.gfx.fillCircle(-4, -4, 4);
    }
  }

  public update(delta: number = 16) {
    this.rotation += this.rotSpeed;
    this.y += this.speed * (delta / 1000);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.reset(this.x, this.y);
    }
  }
}
