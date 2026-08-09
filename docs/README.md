# 結師 ドキュメント索引

Status: Approved  
Last updated: 2026-08-09

## 最初に読む文書

1. [`MASTER_GDD.md`](MASTER_GDD.md) — ゲーム全体の設計
2. [`decisions/DECISIONS.md`](decisions/DECISIONS.md) — 正式決定事項
3. [`decisions/OPEN_QUESTIONS.md`](decisions/OPEN_QUESTIONS.md) — 未決定事項と矛盾
4. [`MVP.md`](MVP.md) — 最初に制作する試作範囲
5. [`FIRST_PLAYABLE.md`](FIRST_PLAYABLE.md) — プロローグから第3章終了までの実装範囲

## 物語・世界観

- [`narrative/WORLD.md`](narrative/WORLD.md)
- [`narrative/MAIN_STORY.md`](narrative/MAIN_STORY.md)
- [`narrative/PROLOGUE_CHAPTER1.md`](narrative/PROLOGUE_CHAPTER1.md)
- [`narrative/CHAPTER_OUTLINE.md`](narrative/CHAPTER_OUTLINE.md)
- [`narrative/CHAPTER_02.md`](narrative/CHAPTER_02.md)
- [`narrative/CHAPTER_03.md`](narrative/CHAPTER_03.md)
- [`narrative/CHARACTERS.md`](narrative/CHARACTERS.md)
- [`narrative/ZASHIKI_WARASHI.md`](narrative/ZASHIKI_WARASHI.md)
- [`narrative/WORLD_HISTORY.md`](narrative/WORLD_HISTORY.md)
- [`narrative/GRANDFATHER_NOTEBOOK.md`](narrative/GRANDFATHER_NOTEBOOK.md)
- [`world/TERMS.md`](world/TERMS.md)

## システム

- [`systems/CORE_LOOP.md`](systems/CORE_LOOP.md)
- [`systems/TIME_SEASONS_STAMINA.md`](systems/TIME_SEASONS_STAMINA.md)
- [`systems/MINIGAME_FRAMEWORK.md`](systems/MINIGAME_FRAMEWORK.md)
- [`systems/KEGARE_SHINKI.md`](systems/KEGARE_SHINKI.md)
- [`systems/FARMING.md`](systems/FARMING.md)
- [`systems/COOKING.md`](systems/COOKING.md)
- [`systems/ALCHEMY.md`](systems/ALCHEMY.md)
- [`systems/GATHERING.md`](systems/GATHERING.md)
- [`systems/YOKAI_FRIENDSHIP.md`](systems/YOKAI_FRIENDSHIP.md)
- [`systems/COEXISTENCE.md`](systems/COEXISTENCE.md)
- [`systems/SHRINE_AND_OFFERINGS.md`](systems/SHRINE_AND_OFFERINGS.md)
- [`systems/COMBAT.md`](systems/COMBAT.md)
- [`systems/PLAYER_COMBAT_GROWTH.md`](systems/PLAYER_COMBAT_GROWTH.md)
- [`systems/FISHING.md`](systems/FISHING.md)

## コンテンツ・世界

- [`content/YOKAI.md`](content/YOKAI.md)
- [`content/YOKAI_KITSUNE.md`](content/YOKAI_KITSUNE.md)
- [`content/YOKAI_KAPPA.md`](content/YOKAI_KAPPA.md)
- [`content/YOKAI_BAKEGAERU.md`](content/YOKAI_BAKEGAERU.md)
- [`content/YOKAI_BOOK.md`](content/YOKAI_BOOK.md)
- [`content/VILLAGERS.md`](content/VILLAGERS.md)
- [`content/VILLAGER_SHIKI.md`](content/VILLAGER_SHIKI.md)
- [`content/VILLAGER_KAEDE.md`](content/VILLAGER_KAEDE.md)
- [`content/VILLAGER_SOICHIRO.md`](content/VILLAGER_SOICHIRO.md)
- [`content/VILLAGER_GENJI.md`](content/VILLAGER_GENJI.md)
- [`content/VILLAGER_GENZO.md`](content/VILLAGER_GENZO.md)
- [`content/VILLAGER_TESSAI.md`](content/VILLAGER_TESSAI.md)
- [`content/VILLAGER_ITSUKI.md`](content/VILLAGER_ITSUKI.md)
- [`content/VILLAGER_SOGEN.md`](content/VILLAGER_SOGEN.md)
- [`content/CROPS.md`](content/CROPS.md)
- [`content/MINIGAME_CATALOG.md`](content/MINIGAME_CATALOG.md)
- [`world/VILLAGE.md`](world/VILLAGE.md)
- [`world/WORLD_MAP.md`](world/WORLD_MAP.md)

## アート・技術

- [`art/ART_DIRECTION.md`](art/ART_DIRECTION.md)
- [`technical/ENGINE_DECISION.md`](technical/ENGINE_DECISION.md)
- [`technical/TECH_STACK.md`](technical/TECH_STACK.md)
- [`technical/DISPLAY_INPUT_FOUNDATION.md`](technical/DISPLAY_INPUT_FOUNDATION.md)

## 更新ルール

- ファイル名にバージョン番号を付けず、Git履歴で変更を管理する。
- 採用済み仕様と提案を同じ節へ混在させない。
- 新しい決定は `DECISIONS.md` と関連する詳細仕様の両方へ反映する。
- 複数システムへ影響する変更は `MASTER_GDD.md` も更新する。
- 未決定事項は勝手に正式仕様へ昇格させず、`OPEN_QUESTIONS.md` に記録する。
