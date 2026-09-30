# アセット読み込み・復旧QA

Status: Implemented
Last updated: 2026-09-03

## 読み込み表示

- ゲームエンジン読込後、Phaser Loaderの進捗を0〜100%へ正規化してログイン画面へ表示する。
- `GAME_READY`受信時に100%とし、ゲーム開始可能状態へ移行する。
- 画面更新は進捗通知だけで行い、ゲーム状態やセーブ状態を変更しない。

## 失敗分類

| 分類 | 対象 | 動作 |
|---|---|---|
| Fatal | 必須Tiled Map JSON | WorldSceneの生成を停止し、Reactへ理由を表示する |
| Warning | 地形・建物・採取物などの仮画像 | 警告を表示し、既存の図形フォールバックで続行する |
| Recoverable | Service Workerの古い／破損キャッシュ | Moribitoアプリキャッシュと登録だけを削除して再読込できる |

## 復旧操作

Fatal画面では通常の再読み込みに加え、「アプリキャッシュを消して再試行」を表示する。この操作が削除するのは `moribito-` で始まるCache StorageとMoribitoのService Worker登録だけで、以下は削除しない。

- クラウドセーブ
- `localStorage`の設定・検証済み端末セーブキャッシュ
- IndexedDBのPendingSave
- 他アプリのCache Storage

## 手動確認

1. 通常起動で進捗バーが増加し、`GAME READY`へ移行する。
2. 任意画像のURLを一時的に壊し、警告後も仮図形で操作できる。
3. 必須マップURLを一時的に壊し、ゲーム画面を生成せずFatal画面を表示する。
4. キャッシュ削除操作後にページが再読込される。
5. 復旧後も設定、端末セーブキャッシュ、PendingSaveが保持される。
6. 複数の任意画像が失敗しても、警告を閉じてプレイを継続できる。
