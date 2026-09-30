import type { StateAccessor, StateChanged } from "./types.js";
import type { InventorySystem } from "./InventorySystem.js";

export class ShopSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  buy(itemId: string, price: number, quantity = 1) {
    const total = price * quantity;
    if (!itemId.trim() || !Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(total) || this.state().player.money < total) return false;
    this.state().player.money -= total; this.inventory.add(itemId, quantity); this.changed("shop"); return true;
  }
  sell(itemId: string, price: number, quantity = 1) {
    if (!itemId.trim() || !Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(this.state().player.money + price * quantity) || !this.inventory.remove(itemId, quantity)) return false;
    this.state().player.money += price * quantity; this.changed("shop"); return true;
  }
}
