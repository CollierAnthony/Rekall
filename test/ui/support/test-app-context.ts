import { InterviewPractice } from '../../../src/application/interview-practice';
import type { Scheduler } from '../../../src/application/ports/scheduler';
import { TodayReview } from '../../../src/application/today-review';
import type { AppContext } from '../../../src/composition-root';
import type { CardReport } from '../../../src/domain/card-report';
import type { Card, Deck } from '../../../src/domain/deck';
import type { CardProgress, Rating } from '../../../src/domain/review';

const DAY_MS = 86_400_000;

export const aCard = (name: string, overrides: Partial<Card> = {}): Card =>
  ({
    id: `react.${name}`,
    moduleId: 'hooks',
    kind: 'recall',
    question: `Question sur ${name} ?`,
    answer: `Réponse sur ${name}.`,
    keyPoints: [`Point clé de ${name}`],
    source: { title: 'Doc', url: 'https://react.dev' },
    difficulty: 1,
    ...overrides,
  }) as Card;

export const aDeck = (cards: readonly Card[]): Deck => ({
  id: 'react',
  title: 'React',
  version: '19.3',
  modules: [{ id: 'hooks', title: 'Hooks' }],
  cards,
});

/** Une carte déjà vue, qui ne revient que dans une semaine. */
export const seenLastWeek = (card: Card, now: Date): CardProgress => ({
  cardId: card.id,
  introducedAt: new Date(now.getTime() - 7 * DAY_MS),
  lastReviewedAt: new Date(now.getTime() - 7 * DAY_MS),
  dueAt: new Date(now.getTime() + 7 * DAY_MS),
  reviewCount: 1,
  lapseCount: 0,
  schedulerState: {},
});

/** Planificateur prévisible : « Raté » fait revenir la carte tout de suite, les autres notes la repoussent. */
const predictableScheduler: Scheduler = {
  previewOutcomes: (cardId, current, reviewedAt) => {
    const outcome = (days: number): CardProgress => ({
      cardId,
      introducedAt: current?.introducedAt ?? reviewedAt,
      lastReviewedAt: reviewedAt,
      dueAt: new Date(reviewedAt.getTime() + days * DAY_MS),
      reviewCount: (current?.reviewCount ?? 0) + 1,
      lapseCount: 0,
      schedulerState: {},
    });
    return { again: outcome(0), hard: outcome(1), good: outcome(3), easy: outcome(7) } satisfies Record<Rating, CardProgress>;
  },
};

type TestAppOptions = {
  readonly decks: readonly Deck[];
  readonly progress?: readonly CardProgress[];
  /** Fait échouer chaque enregistrement de note, comme une base injoignable. */
  readonly failSaves?: boolean;
};

/** Le même câblage que composition-root.ts, avec des adaptateurs en mémoire. */
export async function createTestAppContext({ decks, progress = [], failSaves = false }: TestAppOptions) {
  const saved: CardProgress[] = [];
  const reports: CardReport[] = [];
  const todayReview = new TodayReview({
    deckSource: { loadAll: async () => decks },
    progressRepository: {
      loadAll: async () => progress,
      save: async (next) => {
        if (failSaves) throw new Error('stockage injoignable');
        saved.push(next);
      },
    },
    cardReportRepository: { save: async (report) => void reports.push(report) },
    scheduler: predictableScheduler,
    policy: { newCardsPerDay: 15 },
  });
  const loadedAt = new Date();
  const context: AppContext = {
    todayReview,
    interviewPractice: new InterviewPractice(null),
    storageMode: 'this-device',
    snapshot: await todayReview.loadToday(loadedAt),
    loadedAt,
    newCardsPerDay: 15,
  };
  return { context, saved, reports };
}
