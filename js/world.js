// 世界（地形・障害物・アイテム・ゴール）の生成とスクロール管理。
// プレイヤーは固定 X、世界が左へ流れる。プラットフォームは矩形の連なり、
// 隙間が「崖」、連続部は同じ高さ、崖を挟んで高さが変化する。
import { VIEW_W, VIEW_H, BASE_GROUND_Y, PLAYER_SCREEN_X } from './config.js';

const rand = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;

export class World {
  constructor(stage, vehicle) {
    this.stage = stage;
    this.theme = stage.theme;
    this.difficulty = stage.difficulty;
    this.stageLength = stage.length;

    this.baseSpeed = vehicle.speed;
    this.speed = vehicle.speed;

    // 物理から逆算した安全な最大ギャップ（崖幅）。2段ジャンプで越えられる範囲。
    const airtime = (2 * vehicle.jumpPower) / vehicle.gravity * 1.4;
    this.maxGap = Math.min(220, vehicle.speed * airtime * 0.6);

    this.platforms = [];
    this.obstacles = [];
    this.items = [];
    this.distance = 0;
    this.goal = null;
    this.goalPlaced = false;

    // 開始プラットフォーム（十分長い助走路）。
    const startTop = BASE_GROUND_Y;
    this.platforms.push({ x: 0, width: 700, top: startTop });
    this.spawnX = 700;
    this.lastTop = startTop;

    // 最初は数枚先まで生成しておく。
    while (this.spawnX < VIEW_W + 600) this._generateNext();
  }

  update(dt) {
    // 進行に応じて加速（上限 1.6 倍）。
    const ramp = 1 + Math.min(0.6, this.distance / 14000);
    this.speed = this.baseSpeed * ramp;

    const dx = this.speed * dt;
    this.distance += dx;

    for (const p of this.platforms) p.x -= dx;
    for (const o of this.obstacles) o.x -= dx;
    for (const it of this.items) it.x -= dx;
    if (this.goal) this.goal.x -= dx;
    this.spawnX -= dx;

    // 画面外（左）の掃除。
    this.platforms = this.platforms.filter((p) => p.x + p.width > -80);
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -80);
    this.items = this.items.filter((it) => it.x + it.width > -80 && !it.collected);

    // 先読み生成。
    while (this.spawnX < VIEW_W + 600) this._generateNext();
  }

  // ゴールに到達したか（旗がプレイヤー位置まで流れてきたら）。
  reachedGoal() {
    return this.goal && this.goal.x <= PLAYER_SCREEN_X;
  }

  _generateNext() {
    // ゴール到達距離に達したら、平坦な道＋ゴール旗を一度だけ配置。
    if (!this.goalPlaced && this.distance + this.spawnX > this.stageLength) {
      const top = this.lastTop;
      const plat = { x: this.spawnX, width: 900, top };
      this.platforms.push(plat);
      this.goal = { x: this.spawnX + 200, groundTop: top };
      this.goalPlaced = true;
      this.spawnX += plat.width;
      return;
    }
    // ゴール配置後は平坦路を延ばすだけ。
    if (this.goalPlaced) {
      const plat = { x: this.spawnX, width: 600, top: this.lastTop };
      this.platforms.push(plat);
      this.spawnX += plat.width;
      return;
    }

    const d = this.difficulty;

    // 崖（ギャップ）。序盤は出にくく、難度で頻度・幅が上がる。
    let gap = 0;
    if (this.distance > 900 && chance(0.45 * d)) {
      gap = rand(80, this.maxGap * Math.min(1, 0.7 + d * 0.2));
    }
    const x = this.spawnX + gap;

    // プラットフォーム高さ。崖がある時だけ段差（高さ変化）を許可。
    let top = this.lastTop;
    if (gap > 0 && chance(0.5)) {
      top = clamp(this.lastTop + rand(-60, 60), BASE_GROUND_Y - 110, BASE_GROUND_Y + 30);
    }

    const width = rand(200, 360);
    const plat = { x, width, top };
    this.platforms.push(plat);
    this.lastTop = top;
    this.spawnX = x + width;

    // 障害物（着地直後を避け、平坦中央付近に）。
    if (width >= 240 && chance(0.5 * d)) {
      const type = chance(0.6) ? 'spike' : 'rock';
      const ow = type === 'spike' ? rand(28, 54) : rand(34, 48);
      const oh = type === 'spike' ? 26 : rand(34, 48);
      const ox = x + rand(90, width - 90 - ow);
      this.obstacles.push({ x: ox, y: top - oh, width: ow, height: oh, type });
    }

    // コイン（崖の上にアーチ、または平坦に列）。
    if (chance(0.7)) {
      const n = Math.floor(rand(3, 6));
      const cy = top - rand(70, 130);
      const startCx = gap > 0 ? this.spawnX - width - gap / 2 - (n * 26) / 2 : x + 40;
      for (let i = 0; i < n; i++) {
        const arch = gap > 0 ? -Math.sin((i / (n - 1)) * Math.PI) * 30 : 0;
        this.items.push({ x: startCx + i * 26, y: cy + arch, width: 18, height: 18, type: 'coin' });
      }
    }

    // ハート / ブースト（低確率）。
    if (chance(0.06)) {
      this.items.push({ x: x + width / 2, y: top - rand(80, 120), width: 22, height: 22, type: 'heart' });
    } else if (chance(0.06)) {
      this.items.push({ x: x + width / 2, y: top - rand(80, 120), width: 22, height: 22, type: 'boost' });
    }
  }

  // 指定スクリーン X における地面（プラットフォーム上面 Y）。崖なら null。
  groundTopAt(x) {
    let best = null;
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.width) {
        if (best === null || p.top < best) best = p.top;
      }
    }
    return best;
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export { VIEW_H };
