// 起動・ゲームループ・DOM UI（タイトル/選択/HUD/結果）・Service Worker 登録。
import { Game } from './game.js';
import { VEHICLES } from './vehicles.js';
import { STAGES } from './config.js';
import { bindJump } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = new Game();
bindJump(canvas, () => game.jump());

// ---- オーバーレイ管理 ----
const screens = {
  title: document.getElementById('screen-title'),
  select: document.getElementById('screen-select'),
  cleared: document.getElementById('screen-cleared'),
  gameover: document.getElementById('screen-gameover'),
};
const hud = document.getElementById('hud');

function showScreen(state) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle('visible', key === state);
  }
  hud.classList.toggle('visible', state === 'playing');
  if (state === 'title') refreshTitle();
  if (state === 'select') refreshSelect();
  if (state === 'cleared' || state === 'gameover') refreshResult(state);
}
game.onStateChange = showScreen;

// ---- タイトル ----
function refreshTitle() {
  document.getElementById('title-high').textContent = `ハイスコア: ${game.save.highScore}`;
  document.getElementById('title-coins').textContent = `所持コイン: ${game.save.coins}`;
}

// ---- 選択画面（乗り物・ステージ） ----
function refreshSelect() {
  document.getElementById('select-coins').textContent = `所持コイン: ${game.save.coins}`;

  const vWrap = document.getElementById('vehicle-cards');
  vWrap.innerHTML = '';
  for (const v of VEHICLES) {
    const unlocked = game.isVehicleUnlocked(v.id);
    const card = document.createElement('button');
    card.className = 'card';
    card.classList.toggle('selected', game.selectedVehicleId === v.id);
    card.classList.toggle('locked', !unlocked);
    card.innerHTML = `
      <span class="card-swatch" style="background:${v.color}"></span>
      <strong>${v.name}</strong>
      <small>${v.desc}</small>
      <em>${unlocked ? '選択可' : `🔒 コイン${v.unlockCoins}で解放`}</em>`;
    card.addEventListener('click', () => {
      const ok = game.selectVehicle(v.id);
      if (!ok) flash(card);
      refreshSelect();
    });
    vWrap.appendChild(card);
  }

  const sWrap = document.getElementById('stage-cards');
  sWrap.innerHTML = '';
  STAGES.forEach((s, i) => {
    const unlocked = game.isStageUnlocked(i);
    const cleared = game.save.clearedStages.includes(s.id);
    const card = document.createElement('button');
    card.className = 'card';
    card.classList.toggle('selected', game.selectedStageIndex === i);
    card.classList.toggle('locked', !unlocked);
    card.innerHTML = `
      <strong>${i + 1}. ${s.name}</strong>
      <small>難度 ${'★'.repeat(Math.round(s.difficulty + 0.5))}</small>
      <em>${unlocked ? (cleared ? '✔ クリア済' : 'プレイ可') : '🔒 前ステージをクリア'}</em>`;
    card.addEventListener('click', () => {
      if (!unlocked) { flash(card); return; }
      game.selectStage(i);
      refreshSelect();
    });
    sWrap.appendChild(card);
  });
}

// ---- 結果画面 ----
function refreshResult(state) {
  const r = game.lastResult || { score: 0, coins: 0 };
  const el = document.getElementById(state === 'cleared' ? 'cleared-text' : 'gameover-text');
  const head = state === 'cleared' ? 'ステージクリア！' : 'ゲームオーバー';
  el.innerHTML =
    `<h2>${head}</h2>
     <p>スコア: <b>${r.score}</b></p>
     <p>獲得コイン: ${r.coins}（累計 ${game.save.coins}）</p>
     <p>ハイスコア: ${game.save.highScore}</p>`;
  // 次ステージボタンの有効/無効。
  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    const canNext = state === 'cleared' &&
      game.selectedStageIndex < STAGES.length - 1 &&
      game.isStageUnlocked(game.selectedStageIndex + 1);
    nextBtn.style.display = canNext ? '' : 'none';
  }
}

function flash(el) {
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 300);
}

// ---- ボタン配線 ----
document.getElementById('btn-to-select').addEventListener('click', () => game.goSelect());
document.getElementById('btn-start').addEventListener('click', () => game.start());
document.getElementById('btn-select-back').addEventListener('click', () => game.goTitle());
document.getElementById('btn-retry-go').addEventListener('click', () => game.retry());
document.getElementById('btn-retry-go2').addEventListener('click', () => game.retry());
document.getElementById('btn-next').addEventListener('click', () => game.nextStage());
document.getElementById('btn-cleared-title').addEventListener('click', () => game.goTitle());
document.getElementById('btn-gameover-title').addEventListener('click', () => game.goTitle());

// ---- HUD ----
const hudScore = document.getElementById('hud-score');
const hudCoins = document.getElementById('hud-coins');
const hudStage = document.getElementById('hud-stage');
const hudWarn = document.getElementById('hud-warning');

function updateHud() {
  if (game.state !== 'playing') return;
  hudScore.textContent = `SCORE ${game.score()}`;
  hudCoins.textContent = `🪙 ${game.coinsThisRun}`;
  hudStage.textContent = STAGES[game.selectedStageIndex].name;
  const d = game.rival.danger();
  hudWarn.style.opacity = d > 0.35 ? '1' : '0';
  if (game.player.guard > 0) hudCoins.textContent += `  🛡️${game.player.guard}`;
}

// ---- ゲームループ ----
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05; // タブ復帰時の巨大 dt を抑制
  game.update(dt);
  game.draw(ctx);
  updateHud();
  requestAnimationFrame(loop);
}

showScreen('title');
requestAnimationFrame(loop);

// ---- 画像/canvas のダウンロード防止 ----
// 長押しメニュー(コンテキストメニュー)とドラッグ保存を抑止する。
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('dragstart', (e) => e.preventDefault());

// ---- PWA: インストールボタン ----
let deferredPrompt = null;
const installBtn = document.getElementById('btn-install');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
}
window.addEventListener('appinstalled', () => { if (installBtn) installBtn.hidden = true; });

// ---- PWA: Service Worker 登録 ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
