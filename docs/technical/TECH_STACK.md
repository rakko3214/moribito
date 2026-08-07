# First Playable 技術スタック・ゲーム基盤

Status: Approved
Last updated: 2026-08-07

## 目的

第3章終了までのFirst Playableを、スマートフォンおよびPCのWebブラウザで実現するための技術基盤を定義する。ゲーム内容と戦闘ルールは既存仕様を正とし、技術選定を理由に簡略化・変更しない。

## 基本技術スタック

| 領域 | 採用技術 |
|---|---|
| 言語 | TypeScript |
| Web UI | React |
| ビルド | Vite |
| ゲーム本体 | Phaser |
| マップ制作 | Tiled |
| 描画 | Phaser / WebGL |
| ゲームデータ | JSONを中心としたデータ駆動 |
| 主要対象 | スマートフォンブラウザ |
| 対応対象 | PCブラウザ |

Next.jsは採用せず、ViteによるシンプルなSPA構成を基本とする。

## ReactとPhaserの責務

### React

- Googleログインとログアウト
- ユーザー管理
- タイトル、New Game、Continue
- 設定、音量
- セーブ状態と通信状態の表示
- 確認ダイアログ、エラー、ロードUI
- その他のWebアプリケーション側UI

### Phaser

- プレイヤー、フィールド、マップ、カメラ
- NPC、村人、妖怪、穢れ
- 農業、採取、釣り、料理などのゲームプレイ
- 戦闘、攻撃、結界、浄化、アイテム回収
- アニメーション、エフェクト、当たり判定
- タイルマップ、フィールドイベント、ゲーム内時間との連携

Reactでゲーム本体を実装せず、ReactからPhaser内部のPlayerなどを直接変更しない。

## GameBridge

ReactとPhaserの間にイベント方式の通信層を設ける。

```text
React
  ↓ ↑
GameBridge
  ↓ ↑
Phaser
```

初期イベント例：

- `GAME_READY`
- `SAVE_REQUEST`
- `OPEN_MENU`
- `CLOSE_MENU`
- `GAME_ERROR`

イベント名、payload、応答、エラーの型はTypeScriptで共有し、両者を疎結合に保つ。

## 入力抽象化

ゲームロジックを入力デバイスへ直接依存させない。

```text
MobileInput / DesktopInput
  ↓
PlayerInput
  ↓
PlayerController
```

スマートフォンでは、画面を押した位置を基準にスライドし、押している間360度移動する既存仕様を実装する。PCではキーボードとマウスを同じ内部入力へ変換する。

画面方向は既存仕様どおりスマートフォン縦画面を基準とする。基準解像度、アスペクト比、UI配置、PC操作の正確な割り当ては次の「画面・スマートフォン／PC対応・入力基盤」ブロックで確定し、縦画面で戦闘と生活操作が成立するか実機で再確認する。

## 戦闘実装

Phaserは既存の2Dアクション戦闘仕様を実現するために使用する。

- 2D見下ろし型リアルタイム戦闘
- 360度移動とタップ攻撃
- 攻撃予兆、範囲、弾、弾幕
- 移動回避、結界、結界破壊
- 結界貫通・結界必須攻撃
- ボス攻撃パターン
- 浄化、霊力、ドロップ回収
- 戦闘エフェクト

フィールドから専用の戦闘画面へ常に切り替える構造には固定せず、探索状態と戦闘状態を切り替えられるWorld Scene基盤とCombat Systemの組み合わせを基本候補とする。

## グラフィックと演出

2Dピクセルアート、Sprite、SpriteSheetを基本とし、3DとLive2Dをゲーム本体の標準表現にはしない。

親しみやすいピクセルアートへ、アニメーション、光、パーティクル、カメラ、効果音を組み合わせる。戦闘・環境演出はCore Keeper程度のリッチな2D表現を最終目標とするが、素材や表現を直接模倣しない。

First Playableの必須演出：

- プレイヤー・敵の攻撃と被弾
- 敵攻撃予兆
- 結界展開、被弾、ひび割れ、破壊
- 浄化
- 第2章・第3章ボスの主要演出
- 草木、天候、穢れなど基本的な環境演出

キャラクターは必要に応じて `Idle`、`Walk`、`Attack`、`Damaged`、`Interact`、`Farming`、`Fishing`、`Cooking` などの状態別アニメーションを持つ。敵は `Notice`、`PrepareAttack`、`Attack`、`Recover`、`Purify` などを組み合わせる。

## マップ

Tiledでエリア単位のマップを制作し、Phaser Tilemapとして読み込む。

マップ例：

- `village`
- `home`
- `shrine`
- `forest`
- `old_pond_boss`
- `forest_boss`

基本レイヤー候補：

- `Ground`
- `Decoration`
- `Collision`
- `NPC`
- `Warp`
- `Event`
- `Interactable`

エリア移動、NPC配置、当たり判定、地点イベント、調査、ワープをマップデータから管理できる構造にする。

## データ駆動

仕様データをTypeScriptへ直接埋め込みすぎず、JSONなどへ分離する。

```text
data/
  items
  crops
  npc
  quests
  events
  enemies
  chapters
```

ゲームロジックとコンテンツデータを分け、コンテンツ追加とバランス調整を行いやすくする。データ形式、ID規則、スキーマ検証は内部構造設計で確定する。

## アセット管理

```text
assets/
  characters/player
  characters/villagers
  characters/yokai
  enemies
  maps
  tilesets
  items
  crops
  ui
  effects
  audio/bgm
  audio/se
```

実際のプロジェクト構造へ合わせて調整できるが、画像、音声、マップ、ゲームデータ、プログラムを分離する。

## Phaser Scene方針

初期候補：

- `BootScene`
- `PreloadScene`
- `BaseWorldScene`
- `VillageScene`
- `HomeScene`
- `ShrineScene`
- `ForestScene`
- `CookingScene`
- `FishingScene`
- `TransitionScene`

戦闘はすべてを独立した `BattleScene` へ移動する方式に固定しない。詳細なScene構成、Scene間状態、ローディング境界は内部構造設計で確定する。

## パフォーマンス

スマートフォンブラウザを主要対象として、実装開始時から次を考慮する。

- 不要なオブジェクト生成・破棄を減らす
- 弾とエフェクトに必要に応じてオブジェクトプールを使う
- 画面外オブジェクトの更新を抑える
- 巨大な単一マップへ依存しない
- テクスチャとSpriteSheetを適切に管理する
- 不要な高解像度アセットを避ける
- パーティクル数とエフェクト品質を調整可能にする

First Playableをスマートフォン実機で検証し、測定結果に基づいて最適化する。

## 起動フロー

```text
Webアプリ起動
  ↓
React起動
  ↓
ユーザー認証
  ↓
クラウドセーブ取得
  ↓
Title / Continue / New Game
  ↓
Phaser起動
  ↓
ゲーム開始
```

## AWS構成候補

現段階の候補：

- Amazon S3 + CloudFront：静的Web配信
- Amazon Cognito + Google Login：認証
- Amazon API Gateway + Lambda：セーブAPI
- Amazon DynamoDB：ユーザー別セーブ

AWSの採用、各サービスの設定、認証、セーブ、通信失敗、データ競合は後続ブロックで正式確定する。常時起動するEC2やECSは現時点の第一候補にしない。

## 次の設計ブロック

「画面・スマートフォン／PC対応・入力基盤」を次に確定する。

- 既定のスマートフォン縦画面で戦闘・生活操作が成立するかの実機確認
- 基準解像度とアスペクト比
- 画面スケーリング
- PCブラウザでの表示
- タッチ操作とPC操作
- 360度移動、タップ攻撃、結界入力
- デバイスごとのUI差分
