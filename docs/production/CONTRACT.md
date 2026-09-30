# 本番用アプリの状態と接続契約

Status: Core contract implemented; life and combat state expansion pending  
Last updated: 2026-10-01

## 現在の正本

- `apps/production/src/domain/save.ts` の `GameState` が実行中の状態、`SaveSnapshot` が端末へ書く版付きスナップショットを定義する。旧 `packages/shared` の保存形式は参照資料であり、本番用へ直接渡さない。
- `App.tsx` は最新の `GameState` と最後に保存成功した `SaveSnapshot` を別に保持する。移動イベントで前者だけを更新し、保存時に状態全体を `DeviceSave` へ渡す。
- `DeviceSave` だけが本番専用キー `moribito.production.save.v1` にアクセスする。保存成功時のみ `revision` を進める。失敗時は最後の保存と未保存状態を保持し、再試行できるようにする。
- `mountWorld.ts` は描画・入力・当たり判定を担当する。移動したら `WorldEvent` を通知し、保存や `localStorage` には触れない。現在のイベントは `player.moved` のみで、`applyWorldEvent` が新しい `GameState` を返す。

## 現在のデータ境界

| 領域 | 所有するデータ | 接続方法 |
|---|---|---|
| プレイヤー | `mapId`、ワールド座標 `x/y`、向き | フィールドの `player.moved` → `applyWorldEvent` |
| 時刻 | `day`、`minutes` | 今後の生活ルールが純粋な状態遷移で更新する |
| 進行 | `chapter`、`stepId` | 今後の物語ルールが純粋な状態遷移で更新する |
| 保存メタデータ | `formatVersion`、`saveId`、`revision`、`savedAt` | `DeviceSave` が管理する。ゲームルールは変更しない |

座標はTiledマップのワールドピクセル。マップ描画側がスポーンと衝突を検証し、UI側は座標の意味を推測しない。`GameState` の更新は元のオブジェクトを変更せず、新しい状態を返す。画面に出す一時的な表示や押下状態は保存しない。

## 追加機能の接続手順

1. 生活・物語・戦闘のルールはブラウザ、React、Phaser、保存APIに依存しない関数として作る。入力と更新後の状態、表示に必要な結果を型で表す。
2. 統合セッションがその結果を `GameState` へ適用し、保存対象の変化をdirtyとして扱う。フィールドとの通信が必要なら `WorldEvent` の判別可能な型へ追加する。
3. 保存する項目を追加する前に `formatVersion` を上げ、既存の本番用保存を読める移行処理と失敗時の保持テストを加える。未知の項目を黙って落とさない。保存キーの変更は移行方針が必要な場合だけ行う。
4. 戦闘中の保存可否と敗北時の復帰位置を戦闘実装時に確定する。少なくとも中途半端な戦闘状態を有効な保存として扱わない。

現行の `formatVersion: 1` は最初の移動・保存の範囲に限る。生活・複数マップ・第2～3章の状態フィールドと移行処理はまだ未実装であり、この文書だけを根拠に並行実装を開始しない。各担当の編集範囲と開始条件は `SESSIONS.md` を参照する。
