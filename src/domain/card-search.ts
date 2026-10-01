import type { Card } from './deck';

/** Texte comparable sans casse ni accents : « cle » trouve « Clé ». */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Une carte et son texte normalisé, calculé une fois pour toutes les recherches. */
export type IndexedCard = {
  readonly card: Card;
  readonly question: string;
  readonly fullText: string;
};

export function buildCardSearchIndex(cards: readonly Card[]): IndexedCard[] {
  return cards.map((card) => ({
    card,
    question: normalizeForSearch(card.question),
    fullText: normalizeForSearch(
      [card.question, card.answer, ...card.keyPoints, ...(card.pitfalls ?? []), card.code ?? '', card.details ?? ''].join('\n'),
    ),
  }));
}

/**
 * Cartes qui contiennent tous les mots de la recherche, dans n'importe quel champ.
 * Celles dont la question les contient tous passent en tête ; sinon l'ordre des decks est gardé.
 */
export function searchCards(index: readonly IndexedCard[], query: string): Card[] {
  const terms = normalizeForSearch(query)
    .split(/\s+/)
    .filter((term) => term !== '');
  if (terms.length === 0) return index.map(({ card }) => card);

  const containsAll = (text: string): boolean => terms.every((term) => text.includes(term));
  const matches = index.filter((entry) => containsAll(entry.fullText));
  return [...matches.filter((entry) => containsAll(entry.question)), ...matches.filter((entry) => !containsAll(entry.question))].map(
    ({ card }) => card,
  );
}
