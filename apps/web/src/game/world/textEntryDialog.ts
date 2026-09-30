/** Native modal focus management with the game's visual styling. */
export function openTextEntryDialog(title: string, initialValue: string, maxLength: number, onClose: (value: string | null) => void): () => void {
  const dialog = document.createElement("dialog");
  dialog.className = "game-text-entry";
  const form = document.createElement("form");
  const label = document.createElement("label");
  label.textContent = title;
  const input = document.createElement("input");
  input.type = "text";
  input.value = initialValue;
  input.maxLength = maxLength;
  input.autocomplete = "off";
  label.append(input);
  const hint = document.createElement("p");
  hint.textContent = `${maxLength}文字まで。空欄にすると消去します。`;
  const actions = document.createElement("div");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "キャンセル";
  const confirm = document.createElement("button");
  confirm.type = "submit";
  confirm.textContent = "決定";
  actions.append(cancel, confirm);
  form.append(label, hint, actions);
  dialog.append(form);
  dialog.setAttribute("aria-label", title);
  let settled = false;
  let composing = false;
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; });
  input.addEventListener("keydown", (event) => {
    // IME confirmation must not also confirm the game's dialog.
    if (event.key === "Enter" && (composing || event.isComposing || event.keyCode === 229)) event.preventDefault();
  });
  const finish = (value: string | null) => {
    if (settled) return;
    settled = true;
    dialog.close();
    dialog.remove();
    onClose(value);
  };
  cancel.addEventListener("click", () => finish(null));
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); finish(null); });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (composing) return;
    finish(input.value.slice(0, maxLength));
  });
  document.body.append(dialog);
  dialog.showModal();
  input.focus();
  return () => finish(null);
}
