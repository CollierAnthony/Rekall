import { describe, expect, it } from 'vitest';
import type { Card, CardDifficulty, Deck } from '../../src/domain/deck';
import type { CardProgress } from '../../src/domain/review';
import { advanceTodayQueue, composeTodayQueue, countDueTomorrow, countReviewedToday, startOfNextReviewDay, startOfReviewDay } from '../../src/domain/today-queue';

// Dates locales : la journée de révision commence à 4 h dans le fuseau du navigateur.
const now = new Date(2026, 9, 1, 9, 0);
const at = (day: number, hour: number, minute = 0): Date => new Date(2026, 9, day, hour, minute);
const september = (day: number, hour = 9): Date => new Date(2026, 8, day, hour, 0);

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

const aDeck = (id: string, cards: readonly Card[]): Deck => ({ id, title: id, version: '1', modules: [], cards });
const oneDeck = (cards: readonly Card[]): Deck[] => [aDeck('react', cards)];

const progressMap = (...progress: CardProgress[]): Map<string, CardProgress> => new Map(progress.map((p) => [p.cardId, p]));
const ids = (cards: readonly Card[]): string[] => cards.map((card) => card.id);

describe('startOfReviewDay', () => {
  it('renvoie 4 h la veille pour une date à 3 h 59', () => {
    expect(startOfReviewDay(at(1, 3, 59))).toEqual(september(30, 4));
  });

  it('renvoie 4 h le jour même pour une date à 4 h pile', () => {
    expect(startOfReviewDay(at(1, 4))).toEqual(at(1, 4));
  });
});

describe('startOfNextReviewDay', () => {
  it('renvoie 4 h heure locale le lendemain, y compris la nuit du passage à l’heure d’hiver', () => {
    // En Europe, l’heure d’hiver commence le 25 octobre 2026 : la journée du 24 dure 25 h.
    expect(startOfNextReviewDay(at(24, 9))).toEqual(at(25, 4));
  });
});

describe('composeTodayQueue', () => {
  it('place les cartes dues aujourd’hui en tête, les plus en retard d’abord, puis les nouvelles', () => {
    const [dueLate, dueEarly, dueTonight, unseen] = [aCard('a'), aCard('b'), aCard('c'), aCard('d')];

    const queue = composeTodayQueue(
      oneDeck([dueLate, dueEarly, dueTonight, unseen]),
      progressMap(aProgress(dueLate, september(30)), aProgress(dueEarly, september(28)), aProgress(dueTonight, at(1, 22))),
      now,
      { newCardsPerDay: 10 },
    );

    expect(ids(queue.pending)).toEqual(['react.b', 'react.a', 'react.c', 'react.d']);
  });

  it('garde une carte due à minuit pile mais laisse de côté celles dues à partir de 4 h le lendemain', () => {
    const [midnight, nextReviewDay] = [aCard('midnight'), aCard('next-review-day')];

    const queue = composeTodayQueue(
      oneDeck([midnight, nextReviewDay]),
      progressMap(aProgress(midnight, at(2, 0)), aProgress(nextReviewDay, at(2, 4))),
      now,
      { newCardsPerDay: 10 },
    );

    expect(ids(queue.pending)).toEqual(['react.midnight']);
  });

  it('inclut une carte due à 3 h du matin quand on révise la veille au soir', () => {
    const dueAt3am = aCard('due-at-3am');

    const queue = composeTodayQueue(oneDeck([dueAt3am]), progressMap(aProgress(dueAt3am, at(2, 3))), at(1, 21), { newCardsPerDay: 10 });

    expect(ids(queue.pending)).toEqual(['react.due-at-3am']);
  });

  it('limite les nouvelles cartes en comptant celles déjà introduites aujourd’hui', () => {
    const introducedThisMorning = aCard('seen');
    const unseen = [aCard('n1'), aCard('n2'), aCard('n3')];

    const queue = composeTodayQueue(
      oneDeck([introducedThisMorning, ...unseen]),
      progressMap(aProgress(introducedThisMorning, at(5, 9), at(1, 8))),
      now,
      { newCardsPerDay: 3 },
    );

    expect(ids(queue.pending)).toEqual(['react.n1', 'react.n2']);
  });

  it('ne décompte pas du quota du jour une carte introduite à 1 h du matin, rattachée à la journée de la veille', () => {
    const introducedAt1am = aCard('seen-at-1am');
    const unseen = [aCard('n1'), aCard('n2')];

    const queue = composeTodayQueue(
      oneDeck([introducedAt1am, ...unseen]),
      progressMap(aProgress(introducedAt1am, at(5, 9), at(1, 1))),
      now,
      { newCardsPerDay: 2 },
    );

    expect(ids(queue.pending)).toEqual(['react.n1', 'react.n2']);
  });

  it('décompte du quota de la veille une carte introduite la veille au soir quand on révise encore à 1 h du matin', () => {
    const introducedLastEvening = aCard('seen-last-evening');
    const unseen = [aCard('n1'), aCard('n2')];

    const queue = composeTodayQueue(
      oneDeck([introducedLastEvening, ...unseen]),
      progressMap(aProgress(introducedLastEvening, at(5, 9), september(30, 22))),
      at(1, 1),
      { newCardsPerDay: 2 },
    );

    expect(ids(queue.pending)).toEqual(['react.n1']);
  });

  it('présente les nouvelles cartes d’un deck par difficulté, puis dans l’ordre du fichier', () => {
    const cards = [aCard('hard', 3), aCard('easy1', 1), aCard('medium', 2), aCard('easy2', 1)];

    const queue = composeTodayQueue(oneDeck(cards), new Map(), now, { newCardsPerDay: 10 });

    expect(ids(queue.pending)).toEqual(['react.easy1', 'react.easy2', 'react.medium', 'react.hard']);
  });

  it('introduit les nouvelles cartes deck par deck, dans l’ordre de l’index', () => {
    const javascriptCard = { ...aCard('easy', 1), id: 'javascript.easy' };
    const decks = [aDeck('react', [aCard('hard', 3), aCard('easy', 1)]), aDeck('javascript', [javascriptCard])];

    const queue = composeTodayQueue(decks, new Map(), now, { newCardsPerDay: 10 });

    expect(ids(queue.pending)).toEqual(['react.easy', 'react.hard', 'javascript.easy']);
  });

  it('ne passe au deck suivant que lorsque le précédent est entièrement vu', () => {
    const [seenReact, unseenReact] = [aCard('seen'), aCard('unseen', 3)];
    const javascriptCard = { ...aCard('easy', 1), id: 'javascript.easy' };
    const decks = [aDeck('react', [seenReact, unseenReact]), aDeck('javascript', [javascriptCard])];

    const queue = composeTodayQueue(decks, progressMap(aProgress(seenReact, at(5, 9))), now, { newCardsPerDay: 1 });

    expect(ids(queue.pending)).toEqual(['react.unseen']);
  });
});

describe('advanceTodayQueue', () => {
  const [first, second] = [aCard('first'), aCard('second')];
  const queue = { pending: [first, second], reviewedCount: 0 };

  it('remet la carte en fin de file si elle revient aujourd’hui', () => {
    expect(advanceTodayQueue(queue, at(1, 9), now)).toEqual({ pending: [second, first], reviewedCount: 1 });
  });

  it('remet la carte en fin de file si elle revient après minuit mais avant 4 h', () => {
    expect(advanceTodayQueue(queue, at(2, 1), at(1, 23, 50))).toEqual({ pending: [second, first], reviewedCount: 1 });
  });

  it('retire la carte si sa prochaine échéance tombe dans une autre journée de révision', () => {
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

  it('compte les cartes dues pendant la journée de révision suivante, de 4 h à 4 h', () => {
    const [stillToday, tomorrowStart, tomorrowAfterMidnight, tomorrowLastMinute, afterTomorrow] = [
      aCard('a'),
      aCard('b'),
      aCard('c'),
      aCard('d'),
      aCard('e'),
    ];

    const count = countDueTomorrow(
      progressMap(
        aProgress(stillToday, at(2, 3)),
        aProgress(tomorrowStart, at(2, 4)),
        aProgress(tomorrowAfterMidnight, at(3, 1)),
        aProgress(tomorrowLastMinute, at(3, 3, 59)),
        aProgress(afterTomorrow, at(3, 4)),
      ),
      now,
    );

    expect(count).toBe(3);
  });
});

describe('countReviewedToday', () => {
  it('compte les cartes revues depuis 4 h, pas celles revues la veille au soir', () => {
    const [lastEvening, thisMorning, now9am] = [aCard('a'), aCard('b'), aCard('c')];
    const reviewedAt = (card: Card, when: Date): CardProgress => ({ ...aProgress(card, at(5, 9)), lastReviewedAt: when });

    const count = countReviewedToday(
      progressMap(reviewedAt(lastEvening, september(30, 23)), reviewedAt(thisMorning, at(1, 4)), reviewedAt(now9am, at(1, 9))),
      now,
    );

    expect(count).toBe(2);
  });
});
