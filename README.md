# Cyariso

「チャリ走」に忠実なオリジナルのオートランアクションゲーム（Web / PWA・オフライン対応）。

タップでジャンプ、空中でもう一度タップして **2段ジャンプ**。崖・段差・障害物を越え、
後方から迫るライバル「クロウ」から逃げ切ってゴールを目指す。乗り物は **自転車・バイク・車**
から選択できる。

## 遊び方（操作）
- 画面タップ / クリック / Space / ↑ で **ジャンプ**
- 空中でもう一度入力で **2段ジャンプ**（広い崖・高い段差を越える）
- 崖への落下・障害物への被弾・ライバルに追いつかれるとゲームオーバー
- コインを集めてバイク・車を解放、ステージをクリアして次のステージを解放

## 起動方法（ローカル）
ES モジュール構成のため、`file://` ではなく HTTP 経由で開く必要がある。

```bash
python3 -m http.server 8000
# ブラウザで http://localhost:8000/ を開く
```

2回目以降は Service Worker によりオフラインでもプレイ可能（PWA としてインストールも可）。

## 構成
```
index.html              # エントリ（canvas + UI オーバーレイ）
manifest.webmanifest    # PWA マニフェスト
sw.js                   # Service Worker（オフラインキャッシュ）
css/style.css           # UI スタイル
assets/icon.svg         # アプリアイコン
js/
  main.js        # 起動・ゲームループ・DOM UI・SW 登録
  game.js        # 状態機械・当たり判定・スコア・進行保存の統括
  config.js      # 定数・ステージ定義
  vehicles.js    # 乗り物（自転車/バイク/車）の性能パラメータ
  storage.js     # localStorage 進行保存
  input.js       # 入力（ジャンプのみ）
  render.js      # canvas へのオリジナル図形描画（キャラ/背景/障害物/アイテム）
  world.js       # 地形・障害物・アイテム・ゴールの生成とスクロール
  player.js      # プレイヤー物理（重力/ジャンプ/2段ジャンプ/落下）
  rival.js       # 追跡ライバル
```

## ドキュメント
- [`docs/chariso-research.md`](docs/chariso-research.md) — チャリ走の調査レポート（開発観点）
- [`docs/concept.md`](docs/concept.md) — オリジナルのキャラ・背景・モノのコンセプト設計書

> 本作はチャリ走の遊び心地を参考にした **オリジナル作品** であり、キャラクター・名称・
> アートはすべて独自のもの。
