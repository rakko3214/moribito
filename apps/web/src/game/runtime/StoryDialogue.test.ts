import { describe, expect, it } from "vitest";
import { STORY_DIALOGUES } from "./StoryDialogue.js";

describe("chapter story dialogue", () => {
  it("provides speaker-labelled sequences for both bosses and the kodama turning point", () => {
    for (const sequence of Object.values(STORY_DIALOGUES)) {
      expect(sequence.length).toBeGreaterThanOrEqual(3);
      expect(sequence.every((line) => line.speaker.length > 0 && line.text.length > 0)).toBe(true);
    }
    expect(STORY_DIALOGUES.kodamaEncounter.at(-1)?.text).toContain("木霊じゃない");
    expect(STORY_DIALOGUES.kodamaDeparture.at(-1)?.text).toContain("自分の目");
  });
});
