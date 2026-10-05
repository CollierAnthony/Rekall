import { describe, expect, it } from 'vitest';
import type { CardReport } from '../../src/domain/card-report';
import type { Card, Deck } from '../../src/domain/deck';
import type { CardProgress, Rating } from '../../src/domain/review';
import type { Scheduler } from '../../src/application/ports/scheduler';
import { TodayReview } from '../../src/application/today-review';

const now = new Date(2026, 9, 1, 9, 0);

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

const deck: Deck = {
  id: 'react',
  title: 'React',
  version: '19.3',
  modules: [{ id: 'effects-refs', title: 'Effets & refs' }],
  cards: [aCard('cleanup'), aCard('deps')],
};

/** Planificateur factice : chaque note repousse l'échéance d'autant de jours que son rang. */
const fakeScheduler: Scheduler = {
  previewOutcomes: (cardId, current, reviewedAt) => {
    const outcome = (daysLater: number): CardProgress => ({
      cardId,
      introducedAt: current?.introducedAt ?? reviewedAt,
      lastReviewedAt: reviewedAt,
      dueAt: new Date(reviewedAt.getTime() + daysLater * 86_400_000),
      reviewCount: (current?.reviewCount ?? 0) + 1,
      lapseCount: 0,
      schedulerState: {},
    });
    return { again: outcome(0), hard: outcome(1), good: outcome(2), easy: outcome(3) } satisfies Record<Rating, CardProgress>;
  },
};

function createTodayReview() {
  const saved: CardProgress[] = [];
  const reports: CardReport[] = [];
  const todayReview = new TodayReview({
    deckSource: { loadAll: async () => [deck] },
    progressRepository: { loadAll: async () => saved, save: async (progress) => void saved.push(progress) },
    cardReportRepository: { save: async (report) => void reports.push(report) },
    scheduler: fakeScheduler,
    policy: { newCardsPerDay: 10 },
  });
  return { todayReview, saved, reports };
}

describe('TodayReview', () => {
  it('compose la session du jour à partir des decks et de la progression', async () => {
    const { todayReview } = createTodayReview();

    const snapshot = await todayReview.loadToday(now);

    expect(snapshot.queue.pending.map((card) => card.id)).toEqual(['react.cleanup', 'react.deps']);
    expect(snapshot.unseenCount).toBe(2);
  });

  it('ignore la progression d’une carte qui n’existe plus dans les decks', async () => {
    const { todayReview, saved } = createTodayReview();
    const removedCard = aCard('removed');
    await todayReview.rate(removedCard, undefined, 'hard', now); // due demain

    const snapshot = await todayReview.loadToday(now);

    expect(snapshot.progressByCardId.has(removedCard.id)).toBe(false);
    expect(snapshot.dueTomorrow).toBe(0);
    expect(snapshot.unseenCount).toBe(2);
  });

  it('enregistre la progression correspondant à la note donnée', async () => {
    const { todayReview, saved } = createTodayReview();

    const progress = await todayReview.rate(aCard('cleanup'), undefined, 'good', now);

    expect(saved).toEqual([progress]);
    expect(progress.dueAt).toEqual(new Date(now.getTime() + 2 * 86_400_000));
  });

  it('annonce l’échéance de chaque note sans rien enregistrer', () => {
    const { todayReview, saved } = createTodayReview();

    const dueDates = todayReview.previewDueDates(aCard('cleanup'), undefined, now);

    expect(dueDates.easy).toEqual(new Date(now.getTime() + 3 * 86_400_000));
    expect(saved).toEqual([]);
  });
});
