# First Playable 実装基盤・ロードマップ仕様

Status: Approved  
Last updated: 2026-08-09

## 目的

確定済みのゲーム・クライアント・クラウド仕様を実装へ移すため、リポジトリ構成、開発環境、共有型、テスト、監視およびPhase 0～8の実装順を定義する。

## モノレポ

TypeScriptモノレポとnpm workspacesを採用する。Nx、Turborepo等はFirst Playableでは導入しない。

```text
moribito/
├─ apps/
│  └─ web/
│     ├─ src/
│     │  ├─ app/              # React
│     │  ├─ game/
│     │  │  ├─ runtime/
│     │  │  ├─ state/
│     │  │  ├─ systems/
│     │  │  ├─ scenes/
│     │  │  ├─ input/
│     │  │  ├─ entities/
│     │  │  ├─ save/
│     │  │  └─ bridge/
│     │  ├─ data/
│     │  └─ services/
│     └─ public/assets/
├─ backend/
│  └─ save-api/
│     ├─ getSave.ts
│     ├─ putSave.ts
│     ├─ resetSave.ts
│     └─ repository/
├─ packages/
│  └─ shared/
│     └─ src/
│        ├─ api/
│        ├─ save/
│        ├─ bridge/
│        └─ schema/
├─ infra/
│  └─ cdk/
├─ docs/
├─ package.json
└─ tsconfig.base.json
```

workspacesは `apps/*`、`backend/*`、`packages/*`、`infra/*` を対象とする。

## 環境

| 環境 | 用途 | 構成 |
|---|---|---|
| local | 日常のゲーム開発 | Docker Compose、MockAuth、LocalSaveService、IndexedDB。AWS不要 |
| dev | AWS連携・実機確認 | Google OAuth、Cognito、HTTP API、Lambda、DynamoDB、S3、CloudFront |
| prod | First Playable公開 | devと分離した本番AWSリソース |

AWSリソース名は `moribito-{environment}-{resource}` を基本とする。例：`moribito-dev-saves`、`moribito-prod-save-api`。

## Docker Compose

Docker Composeを標準ローカル開発環境とする。

- `web`：React、Vite、Phaser
- `api`：Lambda相当のローカルSave API
- `dynamodb`：必要になった段階で追加するDynamoDB Local

Phase 0ではAWSとDynamoDB Localを必須にせず、MockAuthとLocalSaveServiceでゲームを起動できるようにする。DynamoDB LocalはSaveDataが固まるPhase 2以降に追加してよい。

`SaveService`をInterface化し、localでは `LocalSaveService`、dev / prodでは `CloudSaveService` を使用する。

## AWS IaC

AWS CDK + TypeScriptを採用し、S3、CloudFront、Cognito、API Gateway HTTP API、Lambda、DynamoDBを再構築可能にする。devとprodはリソース、認証設定、データを分離する。

AWSへの接続はPhase 2でローカル保存・復元が成立した後に行い、ゲーム開発をAWS構築で停止させない。

## API共有型

成功・失敗形式を統一する。

```ts
type ApiSuccess<T> = { success: true; data: T };

type ApiError = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};
```

初期エラーコード：

- `SAVE_NOT_FOUND`
- `SAVE_CONFLICT`
- `INVALID_SAVE`
- `UNSUPPORTED_SAVE_VERSION`
- `UNAUTHORIZED`
- `PAYLOAD_TOO_LARGE`
- `INTERNAL_ERROR`

`PUT /save` は `baseRevision` とSaveDataを受け取り、Conditional Update成功時だけサーバーが新revisionとsavedAtを確定して返す。HTTP Statusとゲーム内部エラーコードは分離する。

## SaveData v1

`packages/shared` のZod Schemaをフロントエンド、Lambda、Migration、Testにおける型とValidationの正とし、TypeScript型はSchemaからinferする。

```text
SaveData v1
├─ player
├─ world
├─ time
├─ inventory
├─ quests
├─ events
├─ npcs
├─ farming
└─ progression
```

### player

- `mapId`、`x`、`y`
- `direction`：`up | down | left | right`
- `money`
- `equippedToolId`、`equippedItemId`

### time

- `year`、`season`、`day`
- `minutes`：0時からの経過分

### inventory

- `items[]`：`itemId`、`quantity`
- `storage[]`：`itemId`、`quantity`

### quests / events

- Quest：進行中の進捗と完了ID
- Event：flagsと完了Event ID

### npcs

NPC IDをキーとして、必要なfriendshipとflagsを保持する。第3章まで未解放の妖怪友好度は保存対象へ先行追加しない。

### farming

plotごとに `plotId`、`cropId`、`plantedDay`、`growthStage`、`wateredToday` を保持する。

### progression

`chapter`、`storyStep`、`unlockedSystems`、`defeatedBosses` を保持する。

### world

Mapごとに `collectedObjects`、`openedChests`、`destroyedObjects`、`flags` を保持する。

Migrationのディレクトリとdispatcherはv1から用意し、将来は1 versionずつ変換する。

## テスト戦略

| 層 | 対象 |
|---|---|
| Unit | System、計算、Schema、Migration |
| Integration | GameRuntime、Event / Quest、SaveMapper、Sceneとの接続 |
| Backend | API、認証Claim、Schema、revision、DynamoDB Repository |
| E2E | ログインから第3章終了・保存・再開まで |

Vitestを基本テストランナーとし、農業、釣り、料理、調合、戦闘、Inventory、Quest、Event、Saveをシステム単位で独立して検証できる構造にする。

## Developer Test Menu

local / devだけで有効にし、prodではビルドまたは実行時フラグで完全に無効化する。ストーリー進行なしで各機能へ直接入れる。

```text
Developer Test Menu
├─ Field / Movement
├─ Farming
├─ Fishing
├─ Cooking
├─ Crafting / Alchemy
├─ Combat
├─ Dialogue / Event
├─ Quest
├─ Inventory
├─ Save / Load
└─ Chapter / Story
```

### Farming Sandbox

作物、成長段階、経過日数、水やり、季節、畑、所持品を指定できる。`+1日`、`+3日`、成長最大、全水やり、全枯れ、全収穫可能を用意する。

### Fishing Sandbox

魚種、難易度、挙動、時間、季節、天候、釣り場を指定し、通常、即ヒット、レア確定、成功寸前、失敗寸前から開始できる。

### Cooking / Alchemy Sandbox

レシピ、材料、工程、難易度、品質を指定し、個別工程または全工程を直接検証できる。

### Combat Sandbox

敵・Boss、解放能力、護身札、霊力、神具、攻撃パターン、状態異常等を指定し、テストダミーや任意の戦闘状態から開始できる。

## CIとデプロイ

GitHub ActionsでPR / push時に次を実行する。

```text
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

初期段階ではprodへ自動デプロイしない。`deploy:dev` と `deploy:prod` を明示的に実行し、prodは追加確認を必要とする。

## 監視・コスト・ログ

- CloudWatch Logs / Metrics / Alarmを使用する。
- AWS Budgetsで月額予算通知を設定する。
- API Gateway throttlingを設定する。
- Lambda Reserved Concurrencyで暴走時の上限を設ける。
- DynamoDBはOn-Demandを基本とし、利用量・コストAlarmを設ける。
- SaveData本文、JWT、Google認証Token、個人情報をログへ出さない。
- request ID、userIdの不可逆な識別表現、結果、error code、処理時間等の運用情報に限定する。

## 実装ロードマップ

### Phase 0：プロジェクト基盤

Vite、React、Phaser、npm workspaces、shared、Zod、Vitest、ESLint、Docker Compose、CDK、CIを起動可能にする。

### Phase 1：フィールド・移動

主人公表示、360度移動、Tiled Map、衝突、カメラ、Map切替を完成させる。ストーリーはまだ結合しない。

### Phase 2：ゲーム基盤・Save

GameRuntime、GameState、GameBridge、Time、Inventory、Event、Quest、SaveMapperを実装し、New Gameから取得・Event・保存・再読込・復元まで通す。その後AWS devへ接続する。

### Phase 3：生活Vertical Slice

農業、採取、料理、釣り、調合、商店、奉納・納品を最小コンテンツで一通り遊べるようにする。

### Phase 4：戦闘Vertical Slice

移動、通常攻撃、敵AI、予兆、被弾、護身札、霊力、浄化、結界、戦闘終了をテスト敵1種で完成させる。

### Phase 5：プロローグ～第1章

タイトル、Googleログイン、New Game、帰郷、志希、農業、神社、初穢れ、結師代理までを統合する。

### Phase 6：第2章

生活システム、依頼、奉納、化け蛙戦までを統合する。

### Phase 7：第3章

陽太、木霊、淀みの大樹、浄化、木霊が森へ去る場面までを統合する。

### Phase 8：First Playable統合・調整

スマートフォン／PC、認証、クラウド保存、各システム、プロローグ～第3章を通し、性能、UX、バランス、進行不能、セーブ破損を修正する。

## First Playable完成条件

Googleログインから開始し、第3章ボス浄化後に善良妖怪が森へ去るところまで、重大な進行不能やセーブ破損なく通しプレイできる。中断・再ログイン・別端末再開でも進行状態が維持される。

Phase 0～8の機能モックは完了した。現在の実装状況と製品化前の残作業は [`../FIRST_PLAYABLE_STATUS.md`](../FIRST_PLAYABLE_STATUS.md) を参照する。
