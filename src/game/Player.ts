import Phaser from 'phaser';
import { GAME_CONFIG, LANES } from '../config/gameConfig';
import { SoundManager } from '../audio/SoundManager';

export class Player extends Phaser.GameObjects.Container {
  private targetX: number = 0;
  private currentLane: number = 1;
  private hp: number = GAME_CONFIG.MAX_HP;
  private isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;

  // Visual components
  private shipBody!: Phaser.GameObjects.Graphics;
  private thruster!: Phaser.GameObjects.Graphics;
  private shieldRing!: Phaser.GameObjects.Graphics;

  public onHpChanged?: (hp: number, maxHp: number) => void;
  public onHit?: () => void;

  constructor(scene: Phaser.Scene, initialX: number, initialY: number) {
    super(scene, initialX, initialY);

    this.targetX = initialX;
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
    this.shipBody = this.scene.add.graphics();
    this.thruster = this.scene.add.graphics();
    this.shieldRing = this.scene.add.graphics();

    this.add([this.thruster, this.shipBody, this.shieldRing]);
    this.drawShip(LANES[this.currentLane].glowColor);
  }

  private drawShip(accentColor: number) {
    this.shipBody.clear();

    // Elegant Faceted Hull (Origami Prism)
    // Left Wing Face
    this.shipBody.fillStyle(0x23221e, 1);
    this.shipBody.beginPath();
    this.shipBody.moveTo(0, -22);
    this.shipBody.lineTo(-20, 16);
    this.shipBody.lineTo(0, 8);
    this.shipBody.closePath();
    this.shipBody.fillPath();

    // Right Wing Face (Subtly lighter facet)
    this.shipBody.fillStyle(0x2c2b26, 1);
    this.shipBody.beginPath();
    this.shipBody.moveTo(0, -22);
    this.shipBody.lineTo(20, 16);
    this.shipBody.lineTo(0, 8);
    this.shipBody.closePath();
    this.shipBody.fillPath();

    // Crisp Terracotta/Accent Ridge Line
    this.shipBody.lineStyle(2, accentColor, 1);
    this.shipBody.beginPath();
    this.shipBody.moveTo(0, -22);
    this.shipBody.lineTo(-20, 16);
    this.shipBody.lineTo(0, 8);
    this.shipBody.lineTo(20, 16);
    this.shipBody.closePath();
    this.shipBody.strokePath();

    // Center Spine Line
    this.shipBody.lineStyle(1.5, 0xfaf9f5, 0.9);
    this.shipBody.lineBetween(0, -20, 0, 8);

    // Warm Jewel Core
    this.shipBody.fillStyle(0xfaf9f5, 1);
    this.shipBody.fillCircle(0, -2, 3.5);

    // Soft Amber Starlight Thruster
    this.thruster.clear();
    this.thruster.fillStyle(0xd97757, 0.65);
    this.thruster.fillCircle(0, 14, 4);

    // Shield Aura Ring
    this.shieldRing.clear();
    this.shieldRing.lineStyle(1.5, 0xd97757, 0.7);
    this.shieldRing.strokeCircle(0, 0, 26);
    this.shieldRing.setVisible(false);
  }

  public setTargetLane(laneIndex: number, targetX: number) {
    if (this.currentLane !== laneIndex) {
      this.currentLane = laneIndex;
      this.targetX = targetX;
      this.drawShip(LANES[laneIndex].glowColor);
      SoundManager.getInstance().playLaneShift();
    }
  }

  public getLane(): number {
    return this.currentLane;
  }

  public getHp(): number {
    return this.hp;
  }

  public reset(initialX: number) {
    this.x = initialX;
    this.targetX = initialX;
    this.currentLane = 1;
    this.hp = GAME_CONFIG.MAX_HP;
    this.isInvulnerable = false;
    this.setAlpha(1);
    this.shieldRing.setVisible(false);
    this.drawShip(LANES[this.currentLane].glowColor);
    if (this.onHpChanged) {
      this.onHpChanged(this.hp, GAME_CONFIG.MAX_HP);
    }
  }

  public takeDamage(): boolean {
    if (this.isInvulnerable || this.hp <= 0) {
      return false;
    }

    this.hp = Math.max(0, this.hp - 1);
    this.isInvulnerable = true;
    this.invulnerableTimer = GAME_CONFIG.INVULNERABILITY_MS;
    this.shieldRing.setVisible(true);

    SoundManager.getInstance().playHit();

    if (this.onHit) {
      this.onHit();
    }

    if (this.onHpChanged) {
      this.onHpChanged(this.hp, GAME_CONFIG.MAX_HP);
    }

    return true;
  }

  public update(delta: number) {
    this.x += (this.targetX - this.x) * GAME_CONFIG.PLAYER_SPEED_LERP;
    this.thruster.setScale(1, 0.8 + Math.random() * 0.4);

    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      const blink = Math.floor(this.invulnerableTimer / 90) % 2 === 0;
      this.setAlpha(blink ? 0.35 : 1.0);
      this.shieldRing.setRotation(this.shieldRing.rotation + 0.05);

      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.setAlpha(1.0);
        this.shieldRing.setVisible(false);
      }
    }
  }
}
