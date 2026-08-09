import Phaser from "phaser";

export class FieldInput {
  private static readonly STICK_RADIUS = 34;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private stickCenter: Phaser.Math.Vector2 | undefined;
  private readonly touchDirection = new Phaser.Math.Vector2();
  constructor(private readonly scene: Phaser.Scene) {
    if (!scene.input.keyboard) throw new Error("Keyboard input is unavailable.");
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" }) as typeof this.wasd;
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.stickCenter = new Phaser.Math.Vector2(pointer.x, pointer.y);
      this.touchDirection.set(0, 0);
    });
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.stickCenter) return;
      const offset = new Phaser.Math.Vector2(pointer.x - this.stickCenter.x, pointer.y - this.stickCenter.y);
      const distance = offset.length();
      if (distance > FieldInput.STICK_RADIUS) {
        const overflow = distance - FieldInput.STICK_RADIUS;
        this.stickCenter.add(offset.clone().normalize().scale(overflow));
        offset.set(pointer.x - this.stickCenter.x, pointer.y - this.stickCenter.y);
      }
      if (offset.lengthSq() >= 9) this.touchDirection.copy(offset).normalize();
      else this.touchDirection.set(0, 0);
    });
    scene.input.on("pointerup", () => {
      this.stickCenter = undefined;
      this.touchDirection.set(0, 0);
    });
  }
  getDirection() {
    const direction = new Phaser.Math.Vector2(Number(this.cursors.right.isDown || this.wasd.right.isDown) - Number(this.cursors.left.isDown || this.wasd.left.isDown), Number(this.cursors.down.isDown || this.wasd.down.isDown) - Number(this.cursors.up.isDown || this.wasd.up.isDown));
    if (direction.lengthSq() === 0 && this.scene.input.activePointer.isDown) direction.copy(this.touchDirection);
    return direction.lengthSq() > 0 ? direction.normalize() : direction;
  }
}
