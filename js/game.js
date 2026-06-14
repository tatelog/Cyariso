// ゲーム本体の状態機械と更新/描画/当たり判定/スコア・進行保存の統括。
import { VIEW_W, VIEW_H, STAGES, PLAYER_SCREEN_X } from './config.js';
import { VEHICLES, getVehicle } from './vehicles.js';
import * as Save from './storage.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Rival } from './rival.js';
import * as R from './render.js';

export class Game {
  constructor() {
    this.save = Save.load();
    this.state = 'title'; // title | select | playing | cleared | gameover
    this.onStateChange = null;

    this.selectedVehicleId = 'bicycle';
    this.selectedStageIndex = this._firstPlayableStage();

    this.world = null;
    this.player = null;
    this.rival = null;
    this.coinsThisRun = 0;
    this.lastResult = null; // { score, coins, cleared }
  }

  _setState(s) {
    this.state = s;
    if (this.onStateChange) this.onStateChange(s);
  }

  _firstPlayableStage() {
    for (let i = 0; i < STAGES.length; i++) {
      if (!this.save.clearedStages.includes(STAGES[i].id)) return i;
    }
    return STAGES.length - 1;
  }

  // ---- 解放判定 ----
  isVehicleUnlocked(id) {
    return this.save.unlockedVehicles.includes(id);
  }
  isStageUnlocked(index) {
    if (index <= 0) return true;
    return this.save.clearedStages.includes(STAGES[index - 1].id);
  }

  // ---- 画面遷移 ----
  goSelect() { this._setState('select'); }
  goTitle() { this._setState('title'); }

  selectVehicle(id) {
    const v = getVehicle(id);
    if (Save.tryUnlockVehicle(this.save, v)) this.selectedVehicleId = id;
    return this.isVehicleUnlocked(id);
  }
  selectStage(index) {
    if (this.isStageUnlocked(index)) this.selectedStageIndex = index;
  }

  start() {
    const vehicle = getVehicle(this.selectedVehicleId);
    const stage = STAGES[this.selectedStageIndex];
    this.world = new World(stage, vehicle);
    this.player = new Player(vehicle);
    // 開始位置を地面に。最初の1タップが空中ジャンプ扱いにならないよう接地状態にする。
    this.player.y = this.world.groundTopAt(PLAYER_SCREEN_X + this.player.w / 2) - this.player.h;
    this.player.onGround = true;
    this.player.jumpsUsed = 0;
    this.rival = new Rival();
    this.coinsThisRun = 0;
    this._setState('playing');
  }

  retry() { this.start(); }

  nextStage() {
    if (this.selectedStageIndex < STAGES.length - 1 &&
        this.isStageUnlocked(this.selectedStageIndex + 1)) {
      this.selectedStageIndex += 1;
    }
    this.start();
  }

  jump() {
    if (this.state === 'playing') this.player.jump();
  }

  score() {
    if (!this.world) return 0;
    return Math.floor(this.world.distance / 10) + this.coinsThisRun * 10;
  }

  // ---- 更新 ----
  update(dt) {
    if (this.state !== 'playing') return;
    const boostActive = this.player.invincible > 0;
    this.world.update(dt);
    this.player.update(dt, this.world);
    this.rival.update(dt, { boost: boostActive });

    this._collideItems();
    this._collideObstacles();

    // ライバルに追いつかれた / 崖落下 / 被弾死 → ゲームオーバー。
    if (this.rival.caught() || this.player.dead) {
      return this._endRun(false);
    }
    // ゴール到達 → クリア。
    if (this.world.reachedGoal()) {
      return this._endRun(true);
    }
  }

  _collideItems() {
    const pr = this.player.rect();
    for (const it of this.world.items) {
      if (it.collected) continue;
      if (overlap(pr, { x: it.x, y: it.y, w: it.width, h: it.height })) {
        it.collected = true;
        if (it.type === 'coin') {
          this.coinsThisRun += 1;
        } else if (it.type === 'heart') {
          this.player.guard += 1;
        } else if (it.type === 'boost') {
          this.player.invincible = 3;
          this.rival.reward(120);
        }
      }
    }
  }

  _collideObstacles() {
    const pr = this.player.rect();
    for (const o of this.world.obstacles) {
      if (o.cleared) continue;
      if (overlap(pr, { x: o.x, y: o.y, w: o.width, h: o.height })) {
        o.cleared = true; // 1回だけ判定
        const survived = this.player.hit();
        if (survived) this.rival.penalize();
      }
    }
  }

  _endRun(cleared) {
    const score = this.score();
    // 進行保存。
    this.save.coins += this.coinsThisRun;
    if (score > this.save.highScore) this.save.highScore = score;
    if (cleared) {
      const id = STAGES[this.selectedStageIndex].id;
      if (!this.save.clearedStages.includes(id)) this.save.clearedStages.push(id);
    }
    Save.save(this.save);

    this.lastResult = { score, coins: this.coinsThisRun, cleared };
    this._setState(cleared ? 'cleared' : 'gameover');
  }

  // ---- 描画 ----
  draw(ctx) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (this.state === 'title' || this.state === 'select') {
      R.drawBackground(ctx, 'town', performance.now() * 0.03);
      return;
    }
    const w = this.world;
    R.drawBackground(ctx, w.theme, w.distance);
    R.drawPlatforms(ctx, w.platforms, w.theme);
    if (w.goal) R.drawGoal(ctx, w.goal.x, w.goal.groundTop);
    for (const o of w.obstacles) if (!o.cleared) R.drawObstacle(ctx, o);
    for (const it of w.items) if (!it.collected) R.drawItem(ctx, it);

    // ライバル
    const rv = this.rival;
    R.drawRider(ctx, rv.screenX(), rv.groundY(w), rv.w, rv.h, this.selectedVehicleId, '#333', { dark: true });

    // プレイヤー（無敵中は点滅）
    const p = this.player;
    const blink = p.invincible > 0 && Math.floor(performance.now() / 90) % 2 === 0;
    if (!blink) {
      const v = getVehicle(this.selectedVehicleId);
      R.drawRider(ctx, p.x, p.y, p.w, p.h, this.selectedVehicleId, v.color, { tilt: p.tilt() });
    }
  }
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export { STAGES, VEHICLES, VIEW_W, VIEW_H };
