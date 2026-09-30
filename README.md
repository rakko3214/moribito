# 結師（ゆいし）

和風の村での暮らし、妖怪との交流、シンプルなシームレスアクション戦闘を組み合わせた、スマートフォン向け生活RPGの開発プロジェクトです。リポジトリ名 `moribito` は開発コードネームとして継続使用します。

## ドキュメント

仕様の入口は [`docs/README.md`](docs/README.md) です。

First Playableの機能モックは、第1～3章の通し進行まで実装済みです。通常プレイの保存先は端末内で、旧クラウドセーブAPIは現在のプレイ経路では使用していません。到達点と製品化前の残作業は [`docs/FIRST_PLAYABLE_STATUS.md`](docs/FIRST_PLAYABLE_STATUS.md) と [`docs/testing/PRODUCTIZATION_BACKLOG.md`](docs/testing/PRODUCTIZATION_BACKLOG.md) を参照してください。

## 本番用アプリの再構築

現行のFirst Playableはタグ `prototype-first-playable-2026-09-30` とブランチ `codex/archive-first-playable` に保存しました。本番用アプリは `apps/production` で段階的に実装します。作業の順序と引き継ぎ状態は [`docs/production/PLAN.md`](docs/production/PLAN.md) と [`docs/production/STATUS.md`](docs/production/STATUS.md) を参照してください。

```bash
npm run dev:production
npm run build:production
```

従来の `npm run dev` はFirst Playableを起動します。新アプリにゲーム機能を移すまでは、旧実装を参照用として保持します。

## ローカル起動

```bash
npm install
npm run dev
```

Dockerを使用する場合：

```bash
docker compose up --build
```

検証コマンド：

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run cdk:synth
```

## 基本方針

- 生活要素 70%、戦闘要素 30%
- Android・iPhoneでは縦画面を基準とし、PCブラウザでは横長画面へ対応
- 見下ろし型フィールドを画面スライドで360度移動
- 農業、料理、採取、修復、交流を物語進行へ結び付ける
- 恋愛要素は採用せず、村人・妖怪との友情を重視する
- 温かみのあるオリジナルの和風ドット絵を採用する
