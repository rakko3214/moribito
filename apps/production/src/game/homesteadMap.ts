import homestead from "../content/maps/homestead.json";

type MapObject = { name: string; x: number; y: number; width?: number; height?: number };
type MapLayer = { name: string; objects?: MapObject[] };
type TiledMap = { width: number; height: number; tilewidth: number; tileheight: number; layers: MapLayer[] };

const map = homestead as TiledMap;
const layer = (name: string) => {
  const found = map.layers.find((entry) => entry.name === name);
  if (!found?.objects) throw new Error(`Missing Tiled layer: ${name}`);
  return found.objects;
};

export const HOMESTEAD = {
  width: map.width * map.tilewidth,
  height: map.height * map.tileheight,
  collisions: layer("collisions").map((item) => ({ x: item.x, y: item.y, width: item.width ?? 0, height: item.height ?? 0 })),
  start: (() => {
    const spawn = layer("spawns").find((item) => item.name === "start");
    if (!spawn) throw new Error("Missing start spawn");
    return { x: spawn.x, y: spawn.y };
  })(),
} as const;

const HALF_WIDTH = 10;
const HALF_HEIGHT = 7;

export function canStandAt(x: number, y: number): boolean {
  if (x - HALF_WIDTH < 0 || y - HALF_HEIGHT < 0 || x + HALF_WIDTH > HOMESTEAD.width || y + HALF_HEIGHT > HOMESTEAD.height) return false;
  return !HOMESTEAD.collisions.some((obstacle) =>
    x + HALF_WIDTH > obstacle.x && x - HALF_WIDTH < obstacle.x + obstacle.width &&
    y + HALF_HEIGHT > obstacle.y && y - HALF_HEIGHT < obstacle.y + obstacle.height,
  );
}
