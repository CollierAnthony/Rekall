import type { Deck } from './deck';
import type { CardProgress } from './review';

/** Avancement d'un deck : combien de ses cartes ont déjà été vues au moins une fois. */
export type DeckProgress = {
  readonly deck: Deck;
  readonly seenCount: number;
};

/** Avancement de chaque deck, dans l'ordre de l'index. */
export function summarizeDeckProgress(decks: readonly Deck[], progressByCardId: ReadonlyMap<string, CardProgress>): DeckProgress[] {
  return decks.map((deck) => ({
    deck,
    seenCount: deck.cards.filter((card) => progressByCardId.has(card.id)).length,
  }));
}
