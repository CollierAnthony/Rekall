import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/domain/deck';
import type { CardProgress } from '../../src/domain/review';
import { currentCardOf, recordRating, revealAnswer, startReviewSession, summarizeReviewSession } from '../../src/domain/review-session';

const now = new Date(2026, 9, 5, 9, 0);
const later = new Date(2026, 9, 5, 9, 1);
const tomorrow = new Date(2026, 9, 6, 9, 0);
const inAWeek = new Date(2026, 9, 12, 9, 0);

const aCard = (name: string): Card => ({
  id: `react.${name}`,
  moduleId: 'effects-refs',
  kind: 'recall',
  question: 'Question',
  answer: 'Réponse',
  keyPoints: ['Point clé'],
  source: { title: 'Doc', url: 'https://react.dev' },
  difficulty: 1,
});

const aProgress = (card: Card, dueAt: Date): CardProgress => ({
  cardId: card.id,
  introducedAt: now,
  lastReviewedAt: now,
  dueAt,
  reviewCount: 1,
  lapseCount: 0,
  schedulerState: {},
});

const cleanup = aCard('cleanup');
const deps = aCard('deps');
const keys = aCard('keys');

const newSession = () => startReviewSession({ pending: [cleanup, deps], reviewedCount: 0 }, new Map());

describe('revealAnswer', () => {
  it('révèle la carte courante à l’instant donné', () => {
    expect(revealAnswer(newSession(), now).revealedAt).toEqual(now);
  });

  it('garde le premier instant si on révèle deux fois', () => {
    const revealed = revealAnswer(newSession(), now);

    expect(revealAnswer(revealed, later).revealedAt).toEqual(now);
  });

  it('ne fait rien quand la session est terminée', () => {
    const done = startReviewSession({ pending: [], reviewedCount: 2 }, new Map());

    expect(revealAnswer(done, now).revealedAt).toBeNull();
  });
});

describe('recordRating', () => {
  it('passe à la carte suivante et retient la progression de la carte notée', () => {
    const rated = recordRating(revealAnswer(newSession(), now), aProgress(cleanup, inAWeek), later);

    expect(currentCardOf(rated)).toBe(deps);
    expect(rated.queue.reviewedCount).toBe(1);
    expect(rated.progressByCardId.get(cleanup.id)?.dueAt).toEqual(inAWeek);
    expect(rated.revealedAt).toBeNull();
  });

  it('remet en fin de file une carte qui revient le jour même', () => {
    const rated = recordRating(revealAnswer(newSession(), now), aProgress(cleanup, later), later);

    expect(rated.queue.pending).toEqual([deps, cleanup]);
  });

  it('ignore une note donnée avant d’avoir révélé la réponse', () => {
    const session = newSession();

    expect(recordRating(session, aProgress(cleanup, inAWeek), later)).toBe(session);
  });

  it('ignore une progression qui concerne une autre carte que la carte courante', () => {
    const revealed = revealAnswer(newSession(), now);

    expect(recordRating(revealed, aProgress(deps, inAWeek), later)).toBe(revealed);
  });
});

describe('summarizeReviewSession', () => {
  it('sépare nouvelles cartes et révisions, et compte ce qui revient demain', () => {
    const session = startReviewSession(
      { pending: [cleanup, deps], reviewedCount: 1 },
      new Map([
        [cleanup.id, aProgress(cleanup, now)],
        [keys.id, aProgress(keys, tomorrow)],
      ]),
    );

    expect(summarizeReviewSession(session, [cleanup, deps, keys], now)).toEqual({
      reviewedCount: 1,
      remainingNewCount: 1,
      remainingReviewCount: 1,
      dueTomorrow: 1,
      unseenCount: 1,
      seenCardCount: 2,
    });
  });
});
