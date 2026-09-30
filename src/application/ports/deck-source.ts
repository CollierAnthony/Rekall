import type { Deck } from '../../domain/deck';

export interface DeckSource {
  loadAll(): Promise<readonly Deck[]>;
}
