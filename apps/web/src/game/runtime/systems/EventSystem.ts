import type { StateAccessor, StateChanged } from "./types.js";

export class EventSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  hasFlag(flag: string) { return this.state().events.flags.includes(flag); }
  setFlag(flag: string) {
    if (this.hasFlag(flag)) return false;
    this.state().events.flags.push(flag);
    this.changed("events");
    return true;
  }
  complete(eventId: string) {
    const completed = this.state().events.completedEventIds;
    if (completed.includes(eventId)) return false;
    completed.push(eventId);
    this.changed("events");
    return true;
  }
}
