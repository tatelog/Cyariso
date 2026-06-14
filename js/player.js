// プレイヤー物理。画面固定 X に立ち、重力で落下、ジャンプ/2段ジャンプで崖・障害物を越える。
import { PLAYER_SCREEN_X, PLAYER_W, PLAYER_H, VIEW_H } from './config.js';

export class Player {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.x = PLAYER_SCREEN_X;
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.y = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpsUsed = 0;

    this.guard = vehicle.guard;     // 残り被弾ガード（車は1, ハートで増加）
    this.invincible = 0;            // ブースト無敵の残り秒
    this.dead = false;
    this.fell = false;
  }

  centerX() {
    return this.x + this.w / 2;
  }

  jump() {
    if (this.dead) return;
    if (this.onGround) {
      this.vy = -this.vehicle.jumpPower;
      this.onGround = false;
      this.jumpsUsed = 1;
    } else if (this.jumpsUsed < 2) {
      this.vy = -this.vehicle.jumpPower * 0.92;
      this.jumpsUsed = 2;
    }
  }

  update(dt, world) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;

    this.vy += this.vehicle.gravity * dt;
    this.y += this.vy * dt;

    const groundTop = world.groundTopAt(this.centerX());
    const feetY = this.y + this.h;

    if (groundTop !== null && this.vy >= 0 && feetY >= groundTop) {
      // 着地。
      this.y = groundTop - this.h;
      this.vy = 0;
      this.onGround = true;
      this.jumpsUsed = 0;
    } else {
      this.onGround = false;
    }

    // 崖下へ落下＝ミス。
    if (this.y > VIEW_H + 40) {
      this.dead = true;
      this.fell = true;
    }
  }

  // 障害物に当たった時の処理。ガード/無敵があれば耐える。耐えたら true。
  hit() {
    if (this.invincible > 0) return true;
    if (this.guard > 0) {
      this.guard -= 1;
      this.invincible = 0.8; // 連続被弾防止の短い無敵
      return true;
    }
    this.dead = true;
    return false;
  }

  rect() {
    return { x: this.x + 8, y: this.y + 6, w: this.w - 16, h: this.h - 8 };
  }

  tilt() {
    return Math.max(-0.25, Math.min(0.25, this.vy / 3200));
  }
}
