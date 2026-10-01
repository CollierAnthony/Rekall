import type { Deck } from '../../domain/deck';

/** Où se range une carte : affiché au-dessus de la question. */
export type CardContext = {
  readonly deckTitle: string;
  readonly moduleTitle: string;
};

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
