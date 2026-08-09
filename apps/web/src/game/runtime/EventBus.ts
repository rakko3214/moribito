type Listener<T> = (event: T) => void;

export class EventBus<T> {
  private readonly listeners = new Set<Listener<T>>();
  emit(event: T) { for (const listener of this.listeners) listener(event); }
  on(listener: Listener<T>) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
}
