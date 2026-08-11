import type { SaveDataV1 } from "@moribito/shared";

export type StateAccessor = () => SaveDataV1;
export type StateChanged = (domain: "time" | "inventory" | "quests" | "events" | "farming" | "gathering" | "cooking" | "fishing" | "alchemy" | "shop" | "offering" | "combat" | "progression" | "npcs") => void;
