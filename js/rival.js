// 追跡ライバル「クロウ」。後方から迫り、被弾や減速で距離が詰まる。追いつかれたら終了。
import { PLAYER_SCREEN_X, BASE_GROUND_Y } from './config.js';
import {
  RIVAL_GAP_START, RIVAL_CATCHUP, RIVAL_HIT_PENALTY,
} from './config.js';

export class Rival {
  constructor() {
    this.gap = RIVAL_GAP_START; // プレイヤーとの距離(px)
    this.w = 60;
    this.h = 56;
  }

  update(dt, opts = {}) {
    // 常にじわじわ詰めてくる。ブースト中は引き離す。
    this.gap -= RIVAL_CATCHUP * dt;
    if (opts.boost) this.gap += 120 * dt;
    // 上限・下限。
    this.gap = Math.min(RIVAL_GAP_START + 60, this.gap);
  }

  penalize() {
    this.gap -= RIVAL_HIT_PENALTY;
  }

  reward(px) {
    this.gap += px;
  }

  caught() {
    return this.gap <= 0;
  }

  screenX() {
    return PLAYER_SCREEN_X - this.gap - this.w;
  }

  // 迫っている度合い（0..1）。HUD の警告表示に使う。
  danger() {
    return Math.max(0, Math.min(1, 1 - this.gap / 120));
  }

  groundY(world) {
    const top = world.groundTopAt(this.screenX() + this.w / 2);
    return (top !== null ? top : BASE_GROUND_Y) - this.h;
  }
}
