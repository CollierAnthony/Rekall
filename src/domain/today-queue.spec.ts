import { describe, expect, it } from 'vitest';
import type { Card, CardDifficulty } from './deck';
import type { CardProgress } from './review';
import { advanceTodayQueue, composeTodayQueue, countDueTomorrow } from './today-queue';

// Dates locales : la notion de « journée » suit le fuseau du navigateur.
const now = new Date(2026, 9, 1, 9, 0);
const at = (day: number, hour: number): Date => new Date(2026, 9, day, hour, 0);
const september = (day: number): Date => new Date(2026, 8, day, 9, 0);

const aCard = (name: string, difficulty: CardDifficulty = 1): Card => ({
  id: `react.${name}`,
  moduleId: 'effects-refs',
  kind: 'recall',
  question: 'Question',
  answer: 'Réponse',
  keyPoints: ['Point clé'],
  source: { title: 'Doc', url: 'https://react.dev' },
  difficulty,
});

const aProgress = (card: Card, dueAt: Date, introducedAt: Date = september(20)): CardProgress => ({
  cardId: card.id,
  introducedAt,
  lastReviewedAt: introducedAt,
  dueAt,
  reviewCount: 1,
  lapseCount: 0,
  schedulerState: {},
});

const progressMap = (...progress: CardProgress[]): Map<string, CardProgress> => new Map(progress.map((p) => [p.cardId, p]));
const ids = (cards: readonly Card[]): string[] => cards.map((card) => card.id);

describe('composeTodayQueue', () => {
  it('place les cartes dues aujourd’hui en tête, les plus en retard d’abord, puis les nouvelles', () => {
    const [dueLate, dueEarly, dueTonight, unseen] = [aCard('a'), aCard('b'), aCard('c'), aCard('d')];

    const queue = composeTodayQueue(
      [dueLate, dueEarly, dueTonight, unseen],
      progressMap(aProgress(dueLate, september(30)), aProgress(dueEarly, september(28)), aProgress(dueTonight, at(1, 22))),
      now,
      { newCardsPerDay: 10 },
    );

    expect(ids(queue.pending)).toEqual(['react.b', 'react.a', 'react.c', 'react.d']);
  });

  it('laisse de côté les cartes dont l’échéance tombe demain ou plus tard', () => {
    const tomorrow = aCard('tomorrow');

    const queue = composeTodayQueue([tomorrow], progressMap(aProgress(tomorrow, at(2, 0))), now, { newCardsPerDay: 10 });

    expect(queue.pending).toEqual([]);
  });

  it('limite les nouvelles cartes en comptant celles déjà introduites aujourd’hui', () => {
    const introducedThisMorning = aCard('seen');
    const unseen = [aCard('n1'), aCard('n2'), aCard('n3')];

    const queue = composeTodayQueue(
      [introducedThisMorning, ...unseen],
      progressMap(aProgress(introducedThisMorning, at(5, 9), at(1, 8))),
      now,
      { newCardsPerDay: 3 },
    );

    expect(ids(queue.pending)).toEqual(['react.n1', 'react.n2']);
  });

  it('présente les nouvelles cartes par difficulté, puis dans l’ordre du deck', () => {
    const cards = [aCard('hard', 3), aCard('easy1', 1), aCard('medium', 2), aCard('easy2', 1)];

    const queue = composeTodayQueue(cards, new Map(), now, { newCardsPerDay: 10 });

    expect(ids(queue.pending)).toEqual(['react.easy1', 'react.easy2', 'react.medium', 'react.hard']);
  });
});

describe('advanceTodayQueue', () => {
  const [first, second] = [aCard('first'), aCard('second')];
  const queue = { pending: [first, second], reviewedCount: 0 };

  it('remet la carte en fin de file si elle revient aujourd’hui', () => {
    expect(advanceTodayQueue(queue, at(1, 9), now)).toEqual({ pending: [second, first], reviewedCount: 1 });
  });

  it('retire la carte si sa prochaine échéance est un autre jour', () => {
    expect(advanceTodayQueue(queue, at(4, 9), now)).toEqual({ pending: [second], reviewedCount: 1 });
  });
});

describe('countDueTomorrow', () => {
  it('compte uniquement les cartes dues demain', () => {
    const [today, tomorrow, later] = [aCard('today'), aCard('tomorrow'), aCard('later')];

    const count = countDueTomorrow(
      progressMap(aProgress(today, at(1, 20)), aProgress(tomorrow, at(2, 18)), aProgress(later, at(3, 8))),
      now,
    );

    expect(count).toBe(1);
  });
});
