import type { Deck } from '../../domain/deck';
import type { CardContext } from './ReviewCard';

/** Deck et module de chaque carte, pour les afficher au-dessus de la question. */
export function buildCardContexts(decks: readonly Deck[]): ReadonlyMap<string, CardContext> {
  return new Map(
    decks.flatMap((deck) => {
      const moduleTitles = new Map(deck.modules.map((deckModule) => [deckModule.id, deckModule.title]));
      return deck.cards.map((card): [string, CardContext] => [
        card.id,
        { deckTitle: deck.title, moduleTitle: moduleTitles.get(card.moduleId) ?? card.moduleId },
      ]);
    }),
  );
}
