import type { MapWorldSprite } from "./mapTerrainPresentation.js";
import type { RawMapObject, RawTiledMap } from "./mapValidation.js";

const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;

function bounds(objects: RawMapObject[]) {
  const left = Math.min(...objects.map((object) => finite(object.x)));
  const top = Math.min(...objects.map((object) => finite(object.y)));
  const right = Math.max(...objects.map((object) => finite(object.x) + finite(object.width)));
  const bottom = Math.max(...objects.map((object) => finite(object.y) + finite(object.height)));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

/** Validates authored collision groups against the displayed sprite footprint. */
export function validateWorldSpriteCollisions(mapId: string, raw: RawTiledMap, sprites: readonly MapWorldSprite[]) {
  const issues: string[] = [];
  const collisions = raw.layers?.find((layer) => layer.name === "collisions")?.objects ?? [];
  for (const sprite of sprites.filter((item) => item.collisionNames?.length)) {
    const names = sprite.collisionNames ?? [];
    const matched = names.map((name) => collisions.find((collision) => collision.name === name)).filter((item): item is RawMapObject => Boolean(item));
    for (const name of names) if (!matched.some((item) => item.name === name)) issues.push(`${mapId} ${sprite.key} is missing collision ${name}`);
    if (matched.length !== names.length) continue;
    const collision = bounds(matched);
    const spriteLeft = sprite.x - sprite.width / 2;
    const spriteRight = sprite.x + sprite.width / 2;
    const spriteBottom = sprite.y + sprite.height * (1 - sprite.originY);
    const horizontalTolerance = Math.max(8, sprite.width * 0.14);
    if (collision.left < spriteLeft - horizontalTolerance || collision.right > spriteRight + horizontalTolerance) issues.push(`${mapId} ${sprite.key} collision exceeds visible width`);
    if (collision.width < sprite.width * 0.55) issues.push(`${mapId} ${sprite.key} collision is too narrow for visible art`);
    if (Math.abs(collision.bottom - spriteBottom) > 24) issues.push(`${mapId} ${sprite.key} collision foot is misaligned`);
  }
  return issues;
}
