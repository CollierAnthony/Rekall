import type { DeckSource } from '../../application/ports/deck-source';
import type { Deck } from '../../domain/deck';
import { parseDeckFile } from './parse-deck-file';
import { parseDeckIndexFile } from './parse-deck-index-file';

/** Charge les decks publiés à côté de la page (public/decks en dev). */
export class FetchDeckSource implements DeckSource {
  readonly #decksUrl: URL;

  constructor(decksUrl: URL) {
    this.#decksUrl = decksUrl;
  }

  async loadAll(): Promise<readonly Deck[]> {
    const deckFiles = parseDeckIndexFile(await this.#fetchJson('index.json'), 'index.json');
    return Promise.all(deckFiles.map(async (deckFile) => parseDeckFile(await this.#fetchJson(deckFile), deckFile)));
  }

  async #fetchJson(fileName: string): Promise<unknown> {
    const response = await fetch(new URL(fileName, this.#decksUrl));
    if (!response.ok) throw new Error(`Impossible de charger ${fileName} (HTTP ${response.status})`);
    return response.json();
  }
}
