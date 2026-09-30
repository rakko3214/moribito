export function alchemyLayout(width: number, height: number) {
  const stacked = width < 600;
  return {
    bowlX: stacked ? width / 2 : width / 2 - 90,
    bowlY: height / 2 + 40,
    instructionX: stacked ? width / 2 : width / 2 + 105,
    instructionY: stacked ? height / 2 - 75 : height / 2 - 5,
    scoreX: stacked ? width / 2 : width / 2 + 105,
    scoreY: stacked ? height / 2 + 140 : height / 2 + 78,
    guideY: stacked ? height / 2 + 170 : height / 2 + 115,
    textWidth: Math.min(240, width - 64),
  };
}
