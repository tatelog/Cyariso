// 描画。画像アセットに依存せず、すべて canvas の図形でオリジナルのアートを描く。
// 後から実画像へ差し替えられるよう、エンティティごとに描画関数を分離している。
import { VIEW_W, VIEW_H } from './config.js';

// ---- 背景（テーマ別パララックス） ----
let starField = null;
function ensureStars() {
  if (starField) return starField;
  starField = [];
  for (let i = 0; i < 120; i++) {
    starField.push({
      x: Math.random() * VIEW_W,
      y: Math.random() * (VIEW_H * 0.8),
      r: Math.random() * 1.6 + 0.3,
      p: Math.random() * 0.6 + 0.3, // パララックス係数
    });
  }
  return starField;
}

export function drawBackground(ctx, theme, scroll) {
  if (theme === 'desert') return drawDesert(ctx, scroll);
  if (theme === 'galaxy') return drawGalaxy(ctx, scroll);
  return drawTown(ctx, scroll);
}

function drawTown(ctx, scroll) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#ff9a5a');
  g.addColorStop(0.5, '#ffcf8b');
  g.addColorStop(1, '#fff0d4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // 太陽
  ctx.fillStyle = 'rgba(255,240,180,0.9)';
  ctx.beginPath();
  ctx.arc(VIEW_W * 0.75, 140, 70, 0, Math.PI * 2);
  ctx.fill();

  // 遠景ビル群（パララックス）
  const off = (scroll * 0.3) % 220;
  ctx.fillStyle = 'rgba(120,90,140,0.55)';
  for (let x = -220; x < VIEW_W + 220; x += 220) {
    const bx = x - off;
    rrect(ctx, bx + 20, 220, 70, 200);
    rrect(ctx, bx + 110, 270, 60, 150);
  }
}

function drawDesert(ctx, scroll) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#7ec8ff');
  g.addColorStop(1, '#ffe7b0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // ピラミッド遠景
  const off = (scroll * 0.25) % 400;
  ctx.fillStyle = 'rgba(214,170,96,0.7)';
  for (let x = -400; x < VIEW_W + 400; x += 400) {
    const px = x - off + 120;
    ctx.beginPath();
    ctx.moveTo(px, 300);
    ctx.lineTo(px + 110, 150);
    ctx.lineTo(px + 220, 300);
    ctx.closePath();
    ctx.fill();
  }
  // 砂丘
  ctx.fillStyle = 'rgba(244,206,140,0.9)';
  const off2 = (scroll * 0.5) % 300;
  ctx.beginPath();
  ctx.moveTo(-10, 360);
  for (let x = -300; x < VIEW_W + 300; x += 150) {
    ctx.quadraticCurveTo(x - off2 + 75, 320, x - off2 + 150, 360);
  }
  ctx.lineTo(VIEW_W + 10, VIEW_H);
  ctx.lineTo(-10, VIEW_H);
  ctx.fill();
}

function drawGalaxy(ctx, scroll) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0b0a2a');
  g.addColorStop(1, '#241552');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const stars = ensureStars();
  ctx.fillStyle = '#ffffff';
  for (const s of stars) {
    const sx = ((s.x - scroll * s.p) % VIEW_W + VIEW_W) % VIEW_W;
    ctx.globalAlpha = s.p;
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 惑星
  const off = (scroll * 0.2) % 700;
  for (let x = -700; x < VIEW_W + 700; x += 700) {
    const px = x - off + 200;
    ctx.fillStyle = '#6f5bd6';
    ctx.beginPath();
    ctx.arc(px, 150, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(px, 150, 78, 18, -0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- 地形 ----
export function drawPlatforms(ctx, platforms, theme) {
  const top = theme === 'galaxy' ? '#3ad6a5' : theme === 'desert' ? '#caa15a' : '#7cc36b';
  const body = theme === 'galaxy' ? '#1f7d68' : theme === 'desert' ? '#9c7637' : '#6a4a2a';
  for (const p of platforms) {
    if (p.x + p.width < -50 || p.x > VIEW_W + 50) continue;
    ctx.fillStyle = body;
    ctx.fillRect(p.x, p.top, p.width, VIEW_H - p.top);
    ctx.fillStyle = top;
    ctx.fillRect(p.x, p.top, p.width, 14);
  }
}

// ---- 障害物 ----
export function drawObstacle(ctx, o) {
  if (o.type === 'spike') {
    ctx.fillStyle = '#d23c3c';
    const n = Math.max(1, Math.floor(o.width / 18));
    const w = o.width / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(o.x + i * w, o.y + o.height);
      ctx.lineTo(o.x + i * w + w / 2, o.y);
      ctx.lineTo(o.x + i * w + w, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    }
  } else { // rock
    ctx.fillStyle = '#8a8f98';
    rrect(ctx, o.x, o.y, o.width, o.height, 10);
    ctx.fillStyle = '#6c727b';
    rrect(ctx, o.x + 6, o.y + o.height * 0.5, o.width - 12, o.height * 0.4, 6);
  }
}

// ---- 収集アイテム ----
export function drawItem(ctx, it) {
  const cx = it.x + it.width / 2;
  const cy = it.y + it.height / 2;
  if (it.type === 'coin') {
    ctx.fillStyle = '#ffcf2e';
    ctx.beginPath();
    ctx.arc(cx, cy, it.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe680';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, it.width / 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (it.type === 'heart') {
    ctx.fillStyle = '#ff5c8a';
    heart(ctx, cx, cy, it.width / 2);
  } else if (it.type === 'boost') {
    ctx.fillStyle = '#39d0ff';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 12);
    ctx.lineTo(cx + 6, cy - 2);
    ctx.lineTo(cx, cy - 2);
    ctx.lineTo(cx + 8, cy + 12);
    ctx.lineTo(cx - 6, cy + 2);
    ctx.lineTo(cx, cy + 2);
    ctx.closePath();
    ctx.fill();
  }
}

// ---- ゴール旗 ----
export function drawGoal(ctx, x, groundTop) {
  ctx.fillStyle = '#444';
  ctx.fillRect(x, groundTop - 150, 8, 150);
  // チェッカー旗
  const fx = x + 8, fy = groundTop - 150, fw = 70, fh = 46, c = 11.5;
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 6; col++) {
      ctx.fillStyle = (r + col) % 2 === 0 ? '#fff' : '#222';
      ctx.fillRect(fx + col * c, fy + r * c, c, c);
    }
  }
  void fw; void fh;
}

// ---- プレイヤー / ライバル ----
// dark=true でライバル（暗いシルエット）として描画。
export function drawRider(ctx, x, y, w, h, vehicleId, color, opts = {}) {
  const dark = opts.dark;
  const tilt = opts.tilt || 0;
  ctx.save();
  ctx.translate(x + w / 2, y + h);
  ctx.rotate(tilt);

  const wheelColor = dark ? '#222' : '#2b2b2b';
  const bodyColor = dark ? '#33334a' : color;
  const wheelR = vehicleId === 'bicycle' ? 16 : vehicleId === 'bike' ? 17 : 15;

  // 車輪
  for (const wx of vehicleId === 'car' ? [-w / 2 + 16, w / 2 - 16] : [-w / 2 + 14, w / 2 - 14]) {
    ctx.fillStyle = wheelColor;
    ctx.beginPath();
    ctx.arc(wx, -wheelR, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark ? '#555' : '#cfcfcf';
    ctx.beginPath();
    ctx.arc(wx, -wheelR, wheelR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ボディ
  ctx.fillStyle = bodyColor;
  if (vehicleId === 'car') {
    rrect(ctx, -w / 2 + 6, -h * 0.55, w - 12, h * 0.3, 8);
    rrect(ctx, -w / 2 + 16, -h * 0.78, w - 36, h * 0.26, 6); // キャビン
  } else if (vehicleId === 'bike') {
    rrect(ctx, -w / 2 + 10, -h * 0.5, w - 20, 12, 6);
    ctx.fillRect(-4, -h * 0.5, 8, -10);
  } else { // bicycle フレーム
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 14, -wheelR);
    ctx.lineTo(0, -h * 0.5);
    ctx.lineTo(w / 2 - 14, -wheelR);
    ctx.lineTo(-2, -wheelR);
    ctx.closePath();
    ctx.stroke();
  }

  // ライダー（頭・体）
  const headY = -h * 0.92;
  ctx.fillStyle = dark ? '#11111a' : '#ffd9a8';
  ctx.beginPath();
  ctx.arc(0, headY, 11, 0, Math.PI * 2);
  ctx.fill();
  // ヘルメット/ゴーグル
  ctx.fillStyle = dark ? '#000' : '#ff5252';
  ctx.beginPath();
  ctx.arc(0, headY - 2, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = dark ? '#6cf' : '#3aa0ff';
  ctx.fillRect(2, headY - 3, 8, 5);
  // 胴
  ctx.fillStyle = dark ? '#22223a' : '#3a7bff';
  rrect(ctx, -8, headY + 8, 16, h * 0.32, 6);

  ctx.restore();
}

// ---- 汎用図形ヘルパー ----
function rrect(ctx, x, y, w, h, r = 6) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fill();
}

function heart(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.7);
  ctx.bezierCurveTo(cx + r, cy - r * 0.3, cx + r * 0.4, cy - r, cx, cy - r * 0.4);
  ctx.bezierCurveTo(cx - r * 0.4, cy - r, cx - r, cy - r * 0.3, cx, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();
}
