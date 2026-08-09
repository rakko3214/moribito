# First Playable クライアント内部アーキテクチャ仕様

Status: Approved  
Last updated: 2026-08-09

## 目的

プロローグから第3章終了までを実装するため、Phaser Scene、ゲーム状態、System、GameBridge、データ駆動、セーブ境界、ロードおよびエラー処理を定義する。

## 全体構成

```text
React（Login / Title / Menu / Settings / Save UI）
  ↕
GameBridge
  ↕
GameRuntime
  ├─ GameState
  ├─ DataRepository
  ├─ EventBus
  ├─ SaveMapper
  └─ Systems
       ↕
Phaser（Boot / Preload / World / Minigame / Transition）
  ↕
Tiled / JSON / Assets
```

ゲームルールと状態管理をReactやSceneへ集中させず、`GameRuntime` と各Systemへ分離する。

## Phaser Scene

### BootScene

Phaser初期化、最低限の設定、実行環境確認、GameBridge接続を行い、進行状態は保持しない。

### PreloadScene

主人公、共通UI、フォント、共通SE・Effect、必須JSON等のCore Assetsを読み込む。全アセットを起動時に一括ロードしない。

### WorldScene

村、自宅、神社、森、川、ボスエリア等の通常ゲームを単一のWorldSceneで扱い、Tiled Mapを切り替える。マップごとのSceneは作らない。

責務はTilemap・Entity・Sprite・Animation・Camera・Effect・Physicsの表示と、InputとSystemの接続に限定する。作物成長、クエスト判定、NPCスケジュール、戦闘ルール等は各Systemが担当する。

### MinigameScene

通常フィールドと異なる操作・ループを持つ料理、釣り、調合等を `mode` で切り替えて扱う。ミニゲームごとのSceneを大量に作らない。

### TransitionScene

入力停止、Fade Out、旧Map破棄、必要アセットロード、新Map生成、Player配置、Fade In、入力再開を管理する。進行状態は保持せず、Overlay Sceneとして実装してもよい。

## 探索と戦闘

通常戦闘・ボス戦とも原則としてBattleSceneへ切り替えない。

```text
WorldScene / Exploration Mode
  ↓ Encounter
CombatSystem.start()
  ↓
WorldScene / Combat Mode
  ↓ 撃破・浄化
CombatSystem.end()
  ↓
Exploration Mode
```

章ボスもBoss MapをWorldSceneへロードし、CombatSystemで進行する。

## GameRuntimeとSystems

`GameRuntime` はSceneを越えて維持され、次を統括する。

- `GameState`
- `DataRepository`
- `EventBus`
- `SaveMapper`
- `PlayerSystem`
- `TimeSystem`
- `InteractionSystem`
- `InventorySystem`
- `QuestSystem`
- `EventSystem`
- `NPCSystem`
- `FarmingSystem`
- `FishingSystem`
- `CombatSystem`
- `ProgressionSystem`

## GameState

永続・進行状態はSceneではなくGameStateへ保持する。

```text
GameState
  ├─ player
  ├─ world
  ├─ time
  ├─ inventory
  ├─ quests
  ├─ events
  ├─ npcs
  ├─ farming
  ├─ progression
  └─ combat
```

`world.maps[mapId]` には採取済みUnique Object、宝箱、永続破壊物、Boss討伐、Event完了等、Mapを離れても必要な状態だけを保持する。通常雑魚の位置等の一時状態は保存しない。

Sprite、Particle、Camera、Tween、Physics Body、Tilemap Object、Animation・Sound InstanceはGameStateへ保存しない。

## RuntimeStateとSaveData

GameStateを直接JSON化せず、SaveMapperで保存形式へ変換する。

```text
GameState → SaveMapper → SaveData → SaveService / API
```

SaveDataは `version` と `savedAt` を必須とし、形式変更時はMigrationを通す。保存対象はplayer、world、time、inventory、quests、events、npcs、farming、progressionを基本とする。具体的なセーブタイミング、競合、復旧は次ブロックで確定する。

## コンテンツデータ

```text
src/data/
  items/ crops/ fish/ recipes/ crafting/
  npcs/ dialogues/ quests/ events/
  enemies/ bosses/ maps/ chapters/
  shops/ tutorials/
```

JSONをコンテンツデータ、TypeScriptをゲームロジックとする。IDは英小文字、snake_case、種類prefixで統一し、表示名が変わっても原則変更しない。

例：`item_wood`、`crop_turnip`、`fish_ayu`、`npc_shiki`、`enemy_kegare_frog`、`boss_yodomi_tree`、`quest_ch01_shrine`、`event_ch01_first_kegare`、`map_village`。

## データ検証

JSONはZod Schemaで検証し、必須項目、型、ID重複、参照整合性を開発段階で確認する。JSON内へ任意Scriptを記述せず、必要な処理は型付きのCondition・ActionとしてTypeScript側へ追加する。

## EventSystem

```text
Conditions → Event発火 → Actions → Flag / Quest更新
```

First Playableの基本Condition：

- `flag` / `not_flag`
- `quest_started` / `quest_completed`
- `chapter`
- `map_enter` / `map_is`
- `time_range`
- `has_item` / `item_count`
- `npc_friendship`
- `system_unlocked`
- `boss_defeated`
- `farming_condition`
- `offering_completed`

複数Conditionは原則ANDとし、複雑なORは必要時に拡張する。

基本Action：

- 入力：`lock_player` / `unlock_player`
- 演出：`dialogue` / `camera_focus` / `camera_reset` / `play_bgm` / `stop_bgm` / `play_se` / `play_effect` / `wait`
- Entity：`move_npc` / `spawn_npc` / `remove_npc` / `spawn_enemy` / `remove_enemy` / `start_combat`
- 進行：`start_quest` / `advance_quest` / `complete_quest` / `set_flag` / `unlock_system`
- 所持品・移動・保存：`give_item` / `remove_item` / `change_map` / `request_save`

## QuestSystem

Questは「プレイヤーが何を達成するか」、Eventは「何が起きるか」として分離する。章進行、村人依頼、奉納・納品は共通のQuest基盤へ載せ、専用進行システムを増やしすぎない。

## GameBridge

React、GameRuntime、Phaserは互いの内部状態へ直接アクセスしない。GameBridgeはTypeScriptの判別可能Union等でイベントとpayloadを型付けする。

React → Game：

- `START_NEW_GAME`
- `LOAD_GAME`
- `PAUSE_GAME` / `RESUME_GAME`
- `SET_AUDIO` / `SET_SETTINGS`
- `SAVE_COMPLETED` / `SAVE_FAILED`

Game → React：

- `GAME_READY`
- `SAVE_REQUEST`
- `OPEN_MENU` / `CLOSE_MENU`
- `GAME_ERROR`

PhaserからAPIへ直接アクセスしない。保存は `GameRuntime → SAVE_REQUEST → GameBridge → React / SaveService → API` とし、結果を `SAVE_COMPLETED` または `SAVE_FAILED` で返す。

## アセットロード

| 段階 | 内容 |
|---|---|
| Core | 主人公、共通UI、フォント、基本SE・Effect |
| Area | Tilemap、Tileset、NPC、敵、エリアBGM |
| Optional | イベント立ち絵、ボス演出、特殊Effect |

スマートフォンの初期ロード時間とメモリ使用量を抑える。

## エラー分類

| 分類 | 方針 | 例 |
|---|---|---|
| Recoverable | 通知して継続 | 保存通信・Optional Assetロード失敗 |
| Warning | 開発ログを出して継続 | 任意SE・画像・データ不足 |
| Fatal | `GAME_ERROR` を送りReactで停止画面 | 必須Map不在、必須JSON不正、復旧不能なSave破損、初期化失敗 |

## 次の設計ブロック

Googleログイン、ユーザー識別、API・AWSサーバーレス構成、ユーザー別クラウド保存、手動・自動セーブ、通信断・再試行、競合、ロード失敗およびSaveData復旧を確定する。

