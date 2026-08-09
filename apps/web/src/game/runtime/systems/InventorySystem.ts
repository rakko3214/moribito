import type { StateAccessor, StateChanged } from "./types.js";

export class InventorySystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  quantity(itemId: string) { return this.state().inventory.items.find((item) => item.itemId === itemId)?.quantity ?? 0; }
  add(itemId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Quantity must be a positive integer.");
    const items = this.state().inventory.items;
    const stack = items.find((item) => item.itemId === itemId);
    if (stack) stack.quantity += quantity;
    else items.push({ itemId, quantity });
    this.changed("inventory");
  }
  remove(itemId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0 || this.quantity(itemId) < quantity) return false;
    const items = this.state().inventory.items;
    const stack = items.find((item) => item.itemId === itemId);
    if (!stack) return false;
    stack.quantity -= quantity;
    if (stack.quantity === 0) items.splice(items.indexOf(stack), 1);
    this.changed("inventory");
    return true;
  }
}
