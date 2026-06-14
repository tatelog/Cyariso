// 乗り物定義。コンセプト設計書 (docs/concept.md) の性能差をパラメータ化。
// speed: 基本スクロール速度(px/s) / jumpPower: ジャンプ初速(px/s)
// gravity: 重力(px/s^2) / guard: 開始時の被弾耐性回数
export const VEHICLES = [
  {
    id: 'bicycle',
    name: '自転車',
    color: '#ff8c33',
    speed: 320,
    jumpPower: 820,
    gravity: 2400,
    guard: 0,
    unlockCoins: 0,
    desc: 'バランス型。よく跳ねる初心者向け。',
  },
  {
    id: 'bike',
    name: 'バイク',
    color: '#3a7bff',
    speed: 430,
    jumpPower: 740,
    gravity: 2500,
    guard: 0,
    unlockCoins: 50,
    desc: '高速でスリリング。上級者向け。',
  },
  {
    id: 'car',
    name: '車',
    color: '#e23b5a',
    speed: 270,
    jumpPower: 660,
    gravity: 2750,
    guard: 1,
    unlockCoins: 120,
    desc: '重く跳ねないが安定。被弾1回ガード。',
  },
];

export function getVehicle(id) {
  return VEHICLES.find((v) => v.id === id) || VEHICLES[0];
}
