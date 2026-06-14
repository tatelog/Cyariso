// localStorage を使った進行保存。ハイスコア・コイン・解放状況・クリア済みステージ。
const KEY = 'cyariso.save.v1';

const DEFAULT_SAVE = {
  highScore: 0,
  coins: 0,                 // 累計所持コイン（解放に使用）
  unlockedVehicles: ['bicycle'],
  clearedStages: [],        // クリア済みステージ id
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const data = JSON.parse(raw);
    return { ...DEFAULT_SAVE, ...data };
  } catch (e) {
    return { ...DEFAULT_SAVE };
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* 保存不可（プライベートモード等）でもゲームは継続 */
  }
}

// 乗り物を解放（コインが足りれば消費して解放）。成功なら true。
export function tryUnlockVehicle(state, vehicle) {
  if (state.unlockedVehicles.includes(vehicle.id)) return true;
  if (state.coins < vehicle.unlockCoins) return false;
  state.coins -= vehicle.unlockCoins;
  state.unlockedVehicles.push(vehicle.id);
  save(state);
  return true;
}
