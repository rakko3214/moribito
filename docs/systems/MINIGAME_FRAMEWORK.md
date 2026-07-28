# ミニゲーム共通基盤

Status: Approved  
Last updated: 2026-07-28  
Related documents:

- [`TIME_SEASONS_STAMINA.md`](TIME_SEASONS_STAMINA.md)
- [`../content/MINIGAME_CATALOG.md`](../content/MINIGAME_CATALOG.md)

## 1. 目的

料理、釣り、鍛冶、戦闘、農業など、単体でもゲームとして成立する複数のコンテンツへ共通の開始・停止・終了・時間・セーブ処理を提供する。

新しいミニゲームを追加するとき、時間システムやセーブシステム本体の変更を原則不要にする。

## 2. フェーズ

すべてのミニゲームは、必要に応じて次のフェーズを持つ。

```text
開始前
  ↓
待機
  ↓
本編
  ↓
結果確定
  ↓
時間加算
  ↓
終了後処理
```

### 開始前

- 必要素材、スタミナ、所要時間、終了予定時刻を表示する。
- この段階で戻った場合は素材・スタミナ・時間を消費しない。
- 開始直前にオートセーブする。

### 待機

釣りで魚が掛かるまでなど、ミニゲーム本編が始まる前の状態。ミニゲームごとに、時間を進めるか停止するか設定する。

### 本編

- 原則としてゲーム内時計を停止する。
- 現実のプレイ時間をゲーム内時間へ反映しない。
- 説明、ポーズ、設定、演出中も停止する。

### 結果確定

- 成功、失敗、中断を確定する。
- 報酬、品質、消費素材、スタミナを確定する。
- 成功、失敗、中断のいずれでも、設定された時間を消費する。

### 時間加算

- ミニゲーム側が算出した分数を時間システムへ渡す。
- 報酬確定と時間加算を一体の処理として保存する。
- 2:00を超えた場合は、結果保存後に強制就寝へ移る。

## 3. 時間タイプ

### A. RealTime

待機・本編を含め通常通り時間が進む。短く操作負荷の低いコンテンツ専用。原則として例外的に使用する。

### B. StartCost

開始時に時間を消費し、本編中は停止する。材料投入時点で作業が確定する加工などに使用できる。

### C. CompletionCost

本編中は停止し、成功・失敗・中断後に時間を加算する。

想定：

- 料理
- 鍛冶
- 戦闘

### D. WaitAndCompletion

待機中は通常時間、本編中は停止、終了時に追加時間を加算する。

想定：

- 釣り

### E. NoTimeCost

開始前、本編、終了後に追加時間を消費しない。

想定：

- 農業の収穫・軽作業
- 短い交流

### F. Custom

既定タイプで表現できない季節行事や特殊イベント用。使用時は専用仕様とテストを必須とする。

## 4. 成功・失敗・中断

### 成功

- 報酬を付与する。
- 成績に応じて品質や数量を決める。
- 規定時間を消費する。

### 失敗

- 規定時間を消費する。
- 料理は低品質品または獲得なしにできる。
- 釣りは獲得なし、または最低品質品にできる。
- 具体的な失敗結果は各仕様書で決める。

### 中断

- 本編開始後の中断は完了時と同じ規定時間を消費する。
- 報酬は原則として付与しない。
- 材料を消費するかは個別仕様で決める。
- 開始前確認から戻る場合は何も消費しない。

## 5. 時間補正

- 基本消費時間はデータとして保持する。
- 設備、能力、妖怪、イベントによる補正を適用できる。
- 補正対象可否と最小時間をミニゲームごとに設定する。
- NoTimeCostへ短縮補正は適用しない。

## 6. 共通データ項目

```yaml
id: fishing_river
system: fishing
time_type: wait_and_completion
pre_game_clock: running
in_game_clock: paused
base_time_minutes: 10
minimum_time_minutes: 5
consume_time_on_success: true
consume_time_on_failure: true
consume_time_on_cancel: true
allow_start_past_limit: true
apply_time_modifiers: true
autosave_before: true
autosave_after: true
```

農業の軽作業例：

```yaml
id: farming_harvest
system: farming
time_type: no_time_cost
pre_game_clock: paused
in_game_clock: paused
base_time_minutes: 0
minimum_time_minutes: 0
consume_time_on_success: false
consume_time_on_failure: false
consume_time_on_cancel: false
allow_start_past_limit: true
apply_time_modifiers: false
autosave_before: false
autosave_after: false
```

## 7. スマートフォン共通要件

- 縦画面で操作できる。
- 主要操作を片手で実行できる。
- 操作対象を十分な大きさにする。
- 長い説明を本編中に強制表示しない。
- ポーズと中断操作を明示する。
- 振動、点滅、ASMR音量を設定で調整できる構造を持つ。
- 結果演出のスキップを検討する。

## 8. セーブと復旧

- 開始前と結果確定後を安全な保存地点とする。
- 本編途中の通常セーブは行わない。
- アプリ強制終了時は開始前状態へ戻す。
- 報酬、素材消費、時間加算が部分的に保存されないようにする。

## 9. 新規ミニゲーム追加手順

1. カタログへ一意なIDを登録する。
2. 所属システムと目的を記載する。
3. 時間タイプを選ぶ。
4. 成功・失敗・中断結果を定義する。
5. 素材、スタミナ、報酬を定義する。
6. 時間補正と下限を定義する。
7. セーブ・復旧動作を確認する。
8. スマートフォン操作とアクセシビリティを確認する。
9. 1日全体の時間バランスを再試遊する。

Customを選ぶ場合は、既定タイプで表現できない理由を仕様書へ記録する。

## 10. MVP実装範囲

- CompletionCost
- WaitAndCompletion
- NoTimeCost
- 成功・失敗・中断
- 開始前・終了後オートセーブ
- 時間加算と2:00超過処理
- 終了予定時刻の表示

StartCost、RealTime、Customは本編候補とし、必要になるまで実装しない。

