/** A gesture belongs to one pointer until released or interrupted. */
export class PointerOwner {
  private id: number | undefined;
  begin(id: number) {
    if (this.id !== undefined) return false;
    this.id = id;
    return true;
  }
  owns(id: number) { return this.id === id; }
  end(id: number) {
    if (!this.owns(id)) return false;
    this.cancel();
    return true;
  }
  cancel() { this.id = undefined; }
}
