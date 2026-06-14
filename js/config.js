// ゲーム全体の定数。論理解像度・物理・ステージ定義など。
export const VIEW_W = 960;
export const VIEW_H = 540;

// プレイヤーは画面上の固定 X に立ち、世界が左へスクロールする。
export const PLAYER_SCREEN_X = 260;

// 地面サーフェスの基準 Y（プラットフォーム上面の基準値）。
export const BASE_GROUND_Y = 430;

// プレイヤーの当たり判定サイズ（乗り物込みの矩形）。
export const PLAYER_W = 64;
export const PLAYER_H = 60;

// ライバルに追いつかれるまでの初期猶予（px）。
export const RIVAL_GAP_START = 240;
// 毎秒ライバルが詰めてくる量（px/s）。
export const RIVAL_CATCHUP = 10;
// 障害物被弾でライバルが詰める量（px）。
export const RIVAL_HIT_PENALTY = 90;

// ステージ定義。length は走行距離（px）でゴールまでの目安。
export const STAGES = [
  { id: 0, name: 'サンセットタウン', theme: 'town',    length: 6000,  difficulty: 1.0 },
  { id: 1, name: 'デザートロード',   theme: 'desert',  length: 8000,  difficulty: 1.25 },
  { id: 2, name: 'スターギャラクシー', theme: 'galaxy', length: 10000, difficulty: 1.5 },
];
