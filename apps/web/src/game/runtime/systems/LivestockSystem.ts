import type { SaveDataV1 } from "@moribito/shared";
import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export type AnimalSpecies = "chicken" | "cow";
type Animal = NonNullable<SaveDataV1["livestock"]>["animals"][number];
const SPECIES = {
  chicken: { name: "鶏", price: 100, building: "building_chicken_coop", capacity: 4, maturity: 3, product: "item_egg" },
  cow: { name: "牛", price: 500, building: "building_livestock_barn", capacity: 3, maturity: 5, product: "item_milk" },
} as const;

export class LivestockSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  get animals(): readonly Animal[] { return this.ensure().animals; }
  hasBuilding(species: AnimalSpecies) { return Boolean(this.state().world.maps.map_homestead?.placedObjects?.some((item) => item.itemId === SPECIES[species].building)); }
  canBuy(species: AnimalSpecies) { const spec = SPECIES[species]; return this.hasBuilding(species) && this.state().player.money >= spec.price && this.animals.filter((animal) => animal.species === species).length < spec.capacity; }
  buy(species: AnimalSpecies) {
    if (!this.canBuy(species)) return undefined;
    const spec = SPECIES[species]; const count = this.animals.filter((animal) => animal.species === species).length + 1;
    this.state().player.money -= spec.price;
    const animal: Animal = { id: `${species}_${this.nextId()}`, species, name: `${spec.name}${count}`, ageDays: 0, friendship: 0, fedToday: false, productReady: false };
    this.ensure().animals.push(animal); this.changed("livestock"); return animal;
  }
  buyFeed(quantity = 5) {
    const cost = quantity * 15; if (!Number.isInteger(quantity) || quantity <= 0 || this.state().player.money < cost) return false;
    this.state().player.money -= cost; this.inventory.add("item_animal_feed", quantity); this.changed("livestock"); return true;
  }
  feed(id: string) {
    const animal = this.ensure().animals.find((item) => item.id === id);
    if (!animal || animal.fedToday || !this.inventory.remove("item_animal_feed", 1)) return false;
    animal.fedToday = true; this.changed("livestock"); return true;
  }
  feedAll() { let count = 0; for (const animal of this.ensure().animals) if (this.feed(animal.id)) count += 1; return count; }
  collect(id: string) {
    const animal = this.ensure().animals.find((item) => item.id === id); if (!animal?.productReady) return false;
    this.inventory.add(SPECIES[animal.species].product, 1); animal.productReady = false; this.changed("livestock"); return true;
  }
  collectAll() { let count = 0; for (const animal of this.ensure().animals) if (this.collect(animal.id)) count += 1; return count; }
  advanceDay() {
    for (const animal of this.ensure().animals) {
      if (animal.fedToday) { animal.ageDays += 1; animal.friendship = Math.min(100, animal.friendship + 5); if (animal.ageDays >= SPECIES[animal.species].maturity) animal.productReady = true; }
      animal.fedToday = false;
    }
    this.changed("livestock");
  }
  private ensure() { return this.state().livestock ??= { animals: [] }; }
  private nextId() { return this.ensure().animals.length + 1; }
}
