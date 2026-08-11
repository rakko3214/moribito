import type { StateAccessor, StateChanged } from "./types.js";

export class InventorySystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  quantity(itemId: string) { return this.state().inventory.items.find((item) => item.itemId === itemId)?.quantity ?? 0; }
  storageQuantity(itemId: string) { return this.state().inventory.storage.find((item) => item.itemId === itemId)?.quantity ?? 0; }
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
  deposit(itemId: string, quantity: number) {
    if (!this.transfer(this.state().inventory.items, this.state().inventory.storage, itemId, quantity)) return false;
    this.changed("inventory"); return true;
  }
  withdraw(itemId: string, quantity: number) {
    if (!this.transfer(this.state().inventory.storage, this.state().inventory.items, itemId, quantity)) return false;
    this.changed("inventory"); return true;
  }
  private transfer(from: Array<{ itemId: string; quantity: number }>, to: Array<{ itemId: string; quantity: number }>, itemId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) return false;
    const source = from.find((item) => item.itemId === itemId);
    if (!source || source.quantity < quantity) return false;
    source.quantity -= quantity;
    if (source.quantity === 0) from.splice(from.indexOf(source), 1);
    const destination = to.find((item) => item.itemId === itemId);
    if (destination) destination.quantity += quantity;
    else to.push({ itemId, quantity });
    return true;
  }
}
