import { describe, expect, it } from 'vitest';
import { cardStatus } from './card-status';
import type { CardProgress } from './review';

const now = new Date(2026, 9, 1, 18, 0);

const dueOn = (dueAt: Date): CardProgress => ({
  cardId: 'react.a',
  introducedAt: new Date(2026, 8, 28),
  lastReviewedAt: new Date(2026, 8, 28),
  dueAt,
  reviewCount: 2,
  lapseCount: 0,
  schedulerState: {},
});

describe('cardStatus', () => {
  it('dit « nouvelle » pour une carte jamais vue', () => {
    expect(cardStatus(undefined, now)).toEqual({ kind: 'new' });
  });

  it('dit « à revoir » pour une carte due avant la fin de la journée de révision, 3 h du matin comprise', () => {
    expect(cardStatus(dueOn(new Date(2026, 8, 30, 9, 0)), now)).toEqual({ kind: 'due' });
    expect(cardStatus(dueOn(new Date(2026, 9, 2, 3, 0)), now)).toEqual({ kind: 'due' });
  });

  it('donne l’échéance d’une carte programmée pour une autre journée', () => {
    const dueAt = new Date(2026, 9, 2, 4, 0);
    expect(cardStatus(dueOn(dueAt), now)).toEqual({ kind: 'scheduled', dueAt });
  });
});
