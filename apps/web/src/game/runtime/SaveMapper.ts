import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";

export class SaveMapper {
  toSaveData(state: SaveDataV1) { return saveDataV1Schema.parse(structuredClone(state)); }
  fromSaveData(saveData: SaveDataV1) { return saveDataV1Schema.parse(structuredClone(saveData)); }
}
