# ミニゲームカタログ

Status: Draft  
Last updated: 2026-07-28  
Related documents:

- [`../systems/MINIGAME_FRAMEWORK.md`](../systems/MINIGAME_FRAMEWORK.md)

## 目的

ゲームシステムとミニゲームを分けて管理し、追加・実装・調整状況を一覧化する。具体的な消費時間は個別仕様と試遊後に入力する。

## 状態

- Concept：構想
- Draft：仕様作成中
- Approved：仕様確定
- Implementing：実装中
- Playtest：試遊中
- Complete：完成
- Deferred：保留

## カタログ

| ID | 名称 | 所属 | 時間タイプ | 基本時間 | MVP | 状態 |
|---|---|---|---|---:|:---:|---|
| MG-FARM-001 | 連続収穫 | 農業 | NoTimeCost | 0分 | ○ | Approved |
| MG-COOK-001 | 切る | 料理 | CompletionCost内の工程 | 料理単位 | ○ | Draft |
| MG-COOK-002 | 混ぜる | 料理 | CompletionCost内の工程 | 料理単位 | ○ | Draft |
| MG-COOK-003 | 焼く・裏返す | 料理 | CompletionCost内の工程 | 料理単位 | ○ | Draft |
| MG-COOK-004 | 味付け | 料理 | CompletionCost内の工程 | 料理単位 | － | Draft |
| MG-COOK-005 | 盛り付け | 料理 | CompletionCost内の工程 | 料理単位 | － | Draft |
| MG-FISH-001 | 川釣り | 釣り | WaitAndCompletion | 未定 | － | Concept |
| MG-BATTLE-001 | 通常戦闘 | 戦闘 | CompletionCost | 未定 | ○ | Concept |
| MG-BATTLE-002 | 浄化戦闘 | 戦闘 | CompletionCost | 未定 | ○ | Concept |
| MG-SMITH-001 | 鍛冶 | 鍛冶 | CompletionCost | 未定 | － | Concept |
| MG-GATHER-001 | 希少素材採取 | 採取 | CompletionCost候補 | 未定 | － | Concept |

## 管理ルール

- 料理の各工程は一つの料理セッション内で実行し、工程ごとではなく料理1品単位で時間を消費する。
- 農業の連続収穫は時間を消費しない。
- 釣りは魚が掛かるまで通常時間が進み、本編中は停止し、結果確定後に追加時間を消費する。
- 戦闘はプレイヤーが考えている現実時間を反映せず、終了後に時間を消費する。
- 新規追加時は `MINIGAME_FRAMEWORK.md` の追加手順に従う。

