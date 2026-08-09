# First Playable アカウント・AWSバックエンド・クラウドセーブ仕様

Status: Approved  
Last updated: 2026-08-09

## 目的

Googleログインとユーザー単位のクラウドセーブを実現し、別端末から安全に再開できる基盤を定義する。ゲームはクライアントで実行し、サーバーは認証、永続化、競合制御、最低限の検証と復旧を担当する。

## AWS構成

```text
Google Account
  ↓
Amazon Cognito User Pool（Google Social Login）
  ↓ Cognito JWT
React / SaveService
  ↓
API Gateway HTTP API（JWT Authorizer）
  ↓
AWS Lambda（TypeScript）
  ↓
Amazon DynamoDB
```

- Cognito Identity Poolは使用しない。
- クライアントからDynamoDB等へ直接アクセスさせない。
- PhaserからAPIを直接呼ばず、GameBridgeとReact / SaveServiceを経由する。

## ログインとユーザー識別

- Googleログインを必須とし、ゲストプレイを実装しない。
- `userId` にはCognito JWTの `sub` を使用し、メールアドレスは使用しない。
- `1 Cognito User = 1 Moribito User = 1 SaveData` とする。
- APIはJWTからuserIdを取得し、クライアント指定のuserIdを信用しない。

```http
PUT /save
Authorization: Bearer <JWT>
```

## クライアント・サーバー責務

クライアントはPlayer、Time、Inventory、Quest、Event、NPC、生活、Combat、Progression、WorldState等のゲームロジックを実行する。

サーバーは認証、ユーザー識別、SaveData取得・保存・リセット、versionと必須Schemaの検証、revisionによる競合検出、JSONサイズ等の入力検証、Current / Previous Save管理を担当する。First Playableはサーバー権威型にせず、ゲームルールをLambdaで再計算しない。

## SaveData

```ts
type SaveData = {
  version: number;
  revision: number;
  savedAt: string;
  player: unknown;
  world: unknown;
  time: unknown;
  inventory: unknown;
  quests: unknown;
  events: unknown;
  npcs: unknown;
  farming: unknown;
  progression: unknown;
};
```

- `version`：Schemaのバージョン。
- `revision`：保存成功ごとに増加する競合検出番号。
- `savedAt`：クラウドへ正常保存したUTC日時。

SaveDataはGameStateからSaveMapperで生成する。全会話、戦闘、移動、アイテム取得等の履歴は保存せず、現在状態の復元に必要な情報だけを持たせる。

WorldStateには開封済み宝箱、採取済みUnique Object、永続破壊物、Boss討伐、EventによるMap変化を保存する。Sprite、Particle、Physics Object、Projectile、一時的な敵位置・HP・Effectは保存しない。

戦闘・ボス戦中はセーブ不可とし、途中終了時は戦闘開始前の安全な状態から再開する。

## DynamoDB

`moribito-saves` テーブルに、1ユーザーのSaveDataを1つの論理単位として一括保存・取得する。

```text
PK: userId（Cognito sub）
attributes: saveVersion / revision / savedAt / saveData
```

不要な履歴を避け、将来必要ならWorldState等を別Itemへ分割できる構造にする。

## スロットと初回起動

- 複数セーブスロットを実装しない。
- ログイン後に `GET /save` を実行し、存在すれば「つづきから」、存在しなければ「はじめから」を表示する。
- ニューゲームは初期GameStateを生成し、最初の安全な保存時にクラウドデータを作成する。
- 既存データがある状態で「はじめから」を選ぶ場合は、削除確認を必須とする。

## SaveManager

すべての保存要求をSaveManagerへ集約し、各SystemはAPIを直接呼ばない。

```text
Systems / Manual Save → SaveManager → SaveMapper → SaveData
  → GameBridge → React / SaveService → API
```

短時間の複数要求はまとめる。`dirty`、`saving`、`saveRequested` を管理し、保存開始後に生じた変更は次回保存対象としてdirtyを維持する。

## オートセーブ

次の正常完了後に即時保存を要求する。

- 就寝して翌日へ移行
- メインクエスト完了、章進行
- Boss撃破・浄化完了
- 重要ストーリーイベント完了
- システム新規解放

Map移動時はdirtyの場合だけ保存する。通常戦、採取、取得、農作業、会話、料理、釣りの1回ごとにはAPIを呼ばない。

定期保存の初期値は5分とし、`5分経過 + 変更あり + 保存可能状態` の場合だけ実行する。5分は調整可能な設定値とする。

戦闘、Boss戦、Event演出、Minigame、Map Transition、重要更新途中では要求をPendingにし、安全な状態へ戻った後に実行する。

## 手動セーブとUI

メニューに「セーブ」を用意し、保存可能状態でSaveManagerを通して実行する。状態を `保存中…`、`保存済み`、`未保存` で通知し、未保存表示はクラウド保存成功まで維持する。

ブラウザ終了・バックグラウンド移行時の送信は試行してよいが、正式なセーブ保証には使用しない。

## 通信失敗とPendingSave

失敗でゲームを即停止せず、1秒、2秒、4秒の指数Backoffで最大3回再試行する。失敗後もdirtyを維持する。

IndexedDBにはクラウド送信失敗時のPendingSaveだけを一時退避する。DynamoDBを正式データ、IndexedDBを未送信データとする。

PendingSaveは `baseRevision` を持つ。次回ログイン時にCloud revisionと一致する場合だけ再送できる。Cloud側が進んでいる場合は自動上書きしない。

## 複数端末競合

`revision` とDynamoDBの条件付き更新によるOptimistic Lockを使用する。revision不一致時は保存を拒否する。

自動マージ、ローカル強制上書き、複雑な競合選択UIは実装せず、クラウド最新版の再読み込みを案内する。

## Migrationとバックアップ

- Migrationは `v1 → v2 → v3` のように1 versionずつ適用する。
- 対応できない新versionはロードせず、ゲーム更新を案内する。
- Schema不正やMigration失敗時に無理にGameStateを生成しない。
- Currentに加えPrevious Saveを1世代保持する。
- 正常保存時に旧CurrentをPreviousへ退避してからNew SaveをCurrentへ保存する。
- PreviousはCurrentのSchema不正、Migration失敗、重大破損時のシステム復旧候補とする。

## API

| API | 用途 |
|---|---|
| `GET /save` | Current Save取得。未作成時は `SAVE_NOT_FOUND` |
| `PUT /save` | version・revision・Schemaを検証して保存 |
| `POST /save/reset` | 既存Saveを退避しニューゲーム用データへ切替 |

Resetは単純DELETEを中心にせず、旧Currentをバックアップ対象として扱える処理にする。

## 確定事項

| 項目 | 仕様 |
|---|---|
| ログイン | Google必須、ゲストなし |
| 認証 | Cognito User Pool / Social Login |
| Identity Pool | 使用しない |
| userId | Cognito `sub` |
| API | HTTP API / JWT Authorizer |
| Backend | Lambda / TypeScript |
| Database | DynamoDB |
| 正式Save | Cloud Current Save |
| ローカル | IndexedDB PendingSaveのみ |
| Save Slot | 1ユーザー1データ |
| Auto Save | 重要時＋dirty時5分間隔 |
| Manual Save | 採用 |
| 戦闘途中Save | 不採用 |
| Retry | 1・2・4秒、最大3回 |
| 競合 | revision / Optimistic Lock |
| 競合時 | Cloud最新版を正とする |
| Migration | versionごとの段階Migration |
| Backup | Previous 1世代 |

