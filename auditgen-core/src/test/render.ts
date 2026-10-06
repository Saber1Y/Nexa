import { createRoot, type Root } from "react-dom/client";
import type { ReactElement } from "react";

// Minimal render/event harness: @testing-library/react is installed but its
// required peer @testing-library/dom is not, so tests drive the DOM directly.

interface Mounted {
  root: Root;
  container: HTMLElement;
}

const mounted: Mounted[] = [];

export function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(element);
  const entry: Mounted = { root, container };
  mounted.push(entry);
  return {
    container,
    unmount() {
      root.unmount();
      container.remove();
      const index = mounted.indexOf(entry);
      if (index >= 0) mounted.splice(index, 1);
    },
  };
}

export function cleanup() {
  let entry = mounted.pop();
  while (entry) {
    entry.root.unmount();
    entry.container.remove();
    entry = mounted.pop();
  }
}

export async function flush(turns = 4): Promise<void> {
  for (let i = 0; i < turns; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export async function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  for (;;) {
    await flush(2);
    if (predicate()) return;
    if (Date.now() - start > timeoutMs) throw new Error("waitFor: condition not reached in time");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

const matches = (value: string, matcher: string | RegExp): boolean =>
  typeof matcher === "string" ? value.includes(matcher) : matcher.test(value);

export const textOf = (container: HTMLElement): string => container.textContent || "";

export const hasText = (container: HTMLElement, matcher: string | RegExp): boolean =>
  matches(textOf(container), matcher);

export function allButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll("button"));
}

export function buttonByText(container: HTMLElement, matcher: string | RegExp): HTMLButtonElement {
  const button = allButtons(container).find((b) => matches(b.textContent || "", matcher));
  if (!button) throw new Error(`No button matching ${String(matcher)}`);
  return button;
}

export function buttonByLabel(container: HTMLElement, label: string): HTMLButtonElement {
  const button = allButtons(container).find((b) => b.getAttribute("aria-label") === label);
  if (!button) throw new Error(`No button with aria-label "${label}"`);
  return button;
}

export function click(element: Element): void {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

export function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function inputByPlaceholder(container: HTMLElement, placeholder: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`);
  if (!input) throw new Error(`No input with placeholder "${placeholder}"`);
  return input;
}

export function links(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a"));
}
