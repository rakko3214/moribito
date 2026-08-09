# 結師（ゆいし）

和風の村での暮らし、妖怪との交流、シンプルなシームレスアクション戦闘を組み合わせた、スマートフォン向け生活RPGの開発プロジェクトです。リポジトリ名 `moribito` は開発コードネームとして継続使用します。

## ドキュメント

仕様の入口は [`docs/README.md`](docs/README.md) です。

現在はFirst Playableの実装段階です。正式決定は各文書の `Status: Approved`、検討中の内容は `Status: Draft` として管理します。

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
