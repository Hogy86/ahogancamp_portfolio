// Security binding constraint #2 (security-review-v1.md MEDIUM finding, pass-1):
// all HUD/overlay DOM text must be written via textContent/createTextNode only -
// never innerHTML/insertAdjacentHTML with interpolated values. These helpers are
// the ONLY sanctioned way the rest of the UI layer touches text content, so the
// contract is enforced by construction (a reviewer can grep for innerHTML and
// expect zero hits outside this comment).

export function setText(element: HTMLElement, text: string): void {
  element.textContent = text;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function clearChildren(element: HTMLElement): void {
  while (element.firstChild) element.removeChild(element.firstChild);
}
