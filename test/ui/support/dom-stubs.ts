import { vi } from 'vitest';

/**
 * Ce que jsdom n'implémente pas et que l'appli appelle : défilement, media queries,
 * et les méthodes de <dialog>. Des bouchons sans effet suffisent, on ne teste pas le rendu visuel.
 */
export function stubMissingDomApis(): void {
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }));
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
  };
}
