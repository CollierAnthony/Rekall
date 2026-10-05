import { describe, expect, it } from 'vitest';
import type { Card, Deck } from '../../src/domain/deck';
import { summarizeDeckProgress } from '../../src/domain/deck-progress';
import type { CardProgress } from '../../src/domain/review';

const aCard = (id: string): Card => ({
  id,
  moduleId: 'm',
  kind: 'recall',
  question: 'Question',
  answer: 'Réponse',
  keyPoints: ['Point clé'],
  source: { title: 'Doc', url: 'https://example.com' },
  difficulty: 1,
});

const aDeck = (id: string, cards: readonly Card[]): Deck => ({ id, title: id, version: '1', modules: [], cards });

const seen = (cardId: string): [string, CardProgress] => [
  cardId,
  {
    cardId,
    introducedAt: new Date(2026, 9, 1),
    lastReviewedAt: new Date(2026, 9, 1),
    dueAt: new Date(2026, 9, 3),
    reviewCount: 1,
    lapseCount: 0,
    schedulerState: {},
  },
];

describe('summarizeDeckProgress', () => {
  it('compte les cartes vues de chaque deck, dans l’ordre de l’index', () => {
    const react = aDeck('react', [aCard('react.a'), aCard('react.b'), aCard('react.c')]);
    const javascript = aDeck('javascript', [aCard('javascript.a')]);

    const summary = summarizeDeckProgress([react, javascript], new Map([seen('react.a'), seen('react.c')]));

    expect(summary.map(({ deck, seenCount }) => [deck.id, seenCount])).toEqual([
      ['react', 2],
      ['javascript', 0],
    ]);
  });
});
