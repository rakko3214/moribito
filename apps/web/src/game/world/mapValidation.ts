export type RawMapProperty = { name?: unknown; value?: unknown };
export type RawMapObject = { id?: unknown; name?: unknown; x?: unknown; y?: unknown; width?: unknown; height?: unknown; point?: unknown; properties?: RawMapProperty[] };
export type RawMapLayer = { name?: unknown; type?: unknown; objects?: RawMapObject[] };
export type RawTiledMap = { width?: unknown; height?: unknown; tilewidth?: unknown; tileheight?: unknown; properties?: RawMapProperty[]; layers?: RawMapLayer[] };

const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const property = (properties: RawMapProperty[] | undefined, name: string) => properties?.find((item) => item.name === name)?.value;

// WorldScene の実際のプレイヤー当たり判定（直径26px・足元基準）に合わせる。
// スポーン点そのものだけでなく、出現した瞬間の身体全体が壁へ重ならないことを保証する。
const PLAYER_SPAWN_FOOTPRINT = { left: 12, right: 14, top: 33, bottom: 7 } as const;

function overlapsPlayerFootprint(spawn: RawMapObject, area: RawMapObject) {
  const x = number(spawn.x) ?? 0;
  const y = number(spawn.y) ?? 0;
  const left = number(area.x) ?? 0;
  const top = number(area.y) ?? 0;
  const right = left + (number(area.width) ?? 0);
  const bottom = top + (number(area.height) ?? 0);
  return x + PLAYER_SPAWN_FOOTPRINT.right > left
    && x - PLAYER_SPAWN_FOOTPRINT.left < right
    && y - PLAYER_SPAWN_FOOTPRINT.bottom > top
    && y - PLAYER_SPAWN_FOOTPRINT.top < bottom;
}

function pointInsideArea(x: number, y: number, area: RawMapObject) {
  const left = number(area.x) ?? 0;
  const top = number(area.y) ?? 0;
  return x > left && x < left + (number(area.width) ?? 0)
    && y > top && y < top + (number(area.height) ?? 0);
}

function transitionHasWalkablePoint(transition: RawMapObject, collisions: RawMapObject[]) {
  const left = number(transition.x) ?? 0;
  const top = number(transition.y) ?? 0;
  const width = number(transition.width) ?? 0;
  const height = number(transition.height) ?? 0;
  const xs = [left + 1, left + width / 2, left + Math.max(1, width - 1)];
  const ys = [top + 1, top + height / 2, top + Math.max(1, height - 1)];
  return xs.some((x) => ys.some((y) => !collisions.some((area) => pointInsideArea(x, y, area))));
}

function footprintIsWalkable(x: number, y: number, pixelWidth: number, pixelHeight: number, collisions: RawMapObject[]) {
  if (x - PLAYER_SPAWN_FOOTPRINT.left < 0 || x + PLAYER_SPAWN_FOOTPRINT.right > pixelWidth
    || y - PLAYER_SPAWN_FOOTPRINT.top < 0 || y - PLAYER_SPAWN_FOOTPRINT.bottom > pixelHeight) return false;
  return !collisions.some((area) => overlapsPlayerFootprint({ x, y }, area));
}

function objectContainsPoint(object: RawMapObject, x: number, y: number) {
  const left = number(object.x) ?? 0;
  const top = number(object.y) ?? 0;
  return x >= left && x <= left + (number(object.width) ?? 0)
    && y >= top && y <= top + (number(object.height) ?? 0);
}

export function validateMapWalkability(mapId: string, raw: RawTiledMap, step = 8) {
  const issues: string[] = [];
  const pixelWidth = (number(raw.width) ?? 0) * (number(raw.tilewidth) ?? 0);
  const pixelHeight = (number(raw.height) ?? 0) * (number(raw.tileheight) ?? 0);
  const layers = raw.layers ?? [];
  const collisions = layers.find((layer) => layer.name === "collisions")?.objects ?? [];
  const spawns = layers.find((layer) => layer.name === "spawns")?.objects ?? [];
  const transitions = layers.find((layer) => layer.name === "transitions")?.objects ?? [];
  const start = spawns.find((spawn) => spawn.name === "start") ?? spawns[0];
  // Dimension/layer errors are reported by validateTiledMap. Cross-map validation
  // stays quiet here so a malformed fixture does not produce duplicate symptoms.
  if (!start || pixelWidth <= 0 || pixelHeight <= 0) return [];

  const startX = Math.round((number(start.x) ?? 0) / step) * step;
  const startY = Math.round((number(start.y) ?? 0) / step) * step;
  if (!footprintIsWalkable(startX, startY, pixelWidth, pixelHeight, collisions)) return [`${mapId} primary spawn is not walkable`];

  const queue: Array<[number, number]> = [[startX, startY]];
  const visited = new Set([`${startX},${startY}`]);
  for (let index = 0; index < queue.length; index += 1) {
    const [x, y] = queue[index]!;
    for (const [nextX, nextY] of [[x + step, y], [x - step, y], [x, y + step], [x, y - step]] as const) {
      const key = `${nextX},${nextY}`;
      if (visited.has(key) || !footprintIsWalkable(nextX, nextY, pixelWidth, pixelHeight, collisions)) continue;
      visited.add(key);
      queue.push([nextX, nextY]);
    }
  }

  const isReachable = (object: RawMapObject) => queue.some(([x, y]) => objectContainsPoint(object, x, y));
  for (const spawn of spawns) {
    const x = Math.round((number(spawn.x) ?? 0) / step) * step;
    const y = Math.round((number(spawn.y) ?? 0) / step) * step;
    if (!visited.has(`${x},${y}`)) issues.push(`${mapId} spawn ${String(spawn.name)} is isolated`);
  }
  for (const transition of transitions) if (!isReachable(transition)) issues.push(`${mapId} transition ${String(transition.name)} is unreachable`);
  return issues;
}

export function validateTiledMap(raw: RawTiledMap, requiredLayers: readonly string[]) {
  const issues: string[] = []; const width = number(raw.width); const height = number(raw.height); const tileWidth = number(raw.tilewidth); const tileHeight = number(raw.tileheight);
  if (!width || !height || !tileWidth || !tileHeight) issues.push("map dimensions and tile size must be positive numbers");
  if (tileWidth !== 32 || tileHeight !== 32) issues.push("tile size must be 32x32");
  for (const name of ["displayName", "background", "accent"]) if (typeof property(raw.properties, name) !== "string") issues.push(`missing map property: ${name}`);
  const layers = raw.layers ?? [];
  for (const name of requiredLayers) if (!layers.some((layer) => layer.name === name && layer.type === "objectgroup")) issues.push(`missing object layer: ${name}`);
  const objectIds = new Set<number>(); const pixelWidth = (width ?? 0) * (tileWidth ?? 0); const pixelHeight = (height ?? 0) * (tileHeight ?? 0);
  for (const layer of layers.filter((item) => item.type === "objectgroup")) {
    const names = new Set<string>();
    for (const object of layer.objects ?? []) {
    const id = number(object.id); const x = number(object.x); const y = number(object.y); const objectWidth = number(object.width) ?? 0; const objectHeight = number(object.height) ?? 0;
    if (!id) issues.push(`${String(layer.name)} object missing numeric id`); else if (objectIds.has(id)) issues.push(`duplicate object id: ${id}`); else objectIds.add(id);
    if (typeof object.name !== "string" || !object.name.trim()) issues.push(`${String(layer.name)} object ${String(id)} missing name`); else if (names.has(object.name)) issues.push(`${String(layer.name)} has duplicate object name: ${object.name}`); else names.add(object.name);
    if (x === undefined || y === undefined || x < 0 || y < 0 || x + objectWidth > pixelWidth || y + objectHeight > pixelHeight) issues.push(`${String(layer.name)} object ${String(object.name)} is outside map bounds`);
    if (layer.name === "collisions" && (objectWidth <= 0 || objectHeight <= 0)) issues.push(`collision ${String(object.name)} must have positive size`);
    if (layer.name === "transitions") {
      if (objectWidth <= 0 || objectHeight <= 0) issues.push(`transition ${String(object.name)} must have positive size`);
      if (typeof property(object.properties, "targetMap") !== "string" || typeof property(object.properties, "targetSpawn") !== "string") issues.push(`transition ${String(object.name)} missing destination`);
    }
    if (layer.name === "spawns" && object.point !== true) issues.push(`spawn ${String(object.name)} must be a point`);
    if (layer.name === "interactables" && (typeof property(object.properties, "label") !== "string" || typeof property(object.properties, "marker") !== "string")) issues.push(`interactable ${String(object.name)} missing label or marker`);
    if (layer.name === "eventZones" && typeof property(object.properties, "eventId") !== "string") issues.push(`event zone ${String(object.name)} missing eventId`);
    if (layer.name === "gatheringNodes") {
      if (typeof property(object.properties, "itemId") !== "string" || typeof property(object.properties, "requiredTool") !== "string" || (number(property(object.properties, "quantity")) ?? 0) <= 0) issues.push(`gathering node ${String(object.name)} has invalid item, quantity or tool`);
      if (object.point !== true) issues.push(`gathering node ${String(object.name)} must be a point`);
    }
    if (layer.name === "npcSpawns") {
      if (typeof property(object.properties, "npcId") !== "string" || number(property(object.properties, "startMinute")) === undefined || number(property(object.properties, "endMinute")) === undefined) issues.push(`npc spawn ${String(object.name)} missing schedule`);
      if (object.point !== true) issues.push(`npc spawn ${String(object.name)} must be a point`);
    }
    }
  }
  return issues;
}

export function validateWorldMapSet(maps: Record<string, RawTiledMap>) {
  const issues: string[] = [];
  for (const [mapId, raw] of Object.entries(maps)) {
    const layers = raw.layers ?? []; const collisions = layers.find((layer) => layer.name === "collisions")?.objects ?? []; const spawns = layers.find((layer) => layer.name === "spawns")?.objects ?? [];
    for (const spawn of spawns) {
      if (collisions.some((area) => overlapsPlayerFootprint(spawn, area))) issues.push(`${mapId} spawn ${String(spawn.name)} overlaps collision with player footprint`);
    }
    for (const transition of layers.find((layer) => layer.name === "transitions")?.objects ?? []) {
      const targetMap = property(transition.properties, "targetMap"); const targetSpawn = property(transition.properties, "targetSpawn");
      if (!transitionHasWalkablePoint(transition, collisions)) issues.push(`${mapId} transition ${String(transition.name)} is fully blocked by collision`);
      if (typeof targetMap !== "string" || !maps[targetMap]) { issues.push(`${mapId} transition ${String(transition.name)} targets unknown map`); continue; }
      const targetSpawns = maps[targetMap]?.layers?.find((layer) => layer.name === "spawns")?.objects ?? [];
      if (typeof targetSpawn !== "string" || !targetSpawns.some((spawn) => spawn.name === targetSpawn)) issues.push(`${mapId} transition ${String(transition.name)} targets unknown spawn`);
      const returnTransitions = maps[targetMap]?.layers?.find((layer) => layer.name === "transitions")?.objects ?? [];
      const hasReturnPath = returnTransitions.some((candidate) => property(candidate.properties, "targetMap") === mapId);
      if (!hasReturnPath) issues.push(`${mapId} transition ${String(transition.name)} has no return path from ${targetMap}`);
    }
    issues.push(...validateMapWalkability(mapId, raw));
  }
  return issues;
}
