import type { Card, Deck } from '../domain/deck';
import type { CardReport } from '../domain/card-report';
import type { CardProgress, Rating } from '../domain/review';
import { composeTodayQueue, countDueTomorrow, type TodayPolicy, type TodayQueue } from '../domain/today-queue';
import type { CardReportRepository } from './ports/card-report-repository';
import type { DeckSource } from './ports/deck-source';
import type { ProgressRepository } from './ports/progress-repository';
import type { Scheduler } from './ports/scheduler';

export type TodayReviewDependencies = {
  readonly deckSource: DeckSource;
  readonly progressRepository: ProgressRepository;
  readonly cardReportRepository: CardReportRepository;
  readonly scheduler: Scheduler;
  readonly policy: TodayPolicy;
};

export type TodaySnapshot = {
  readonly decks: readonly Deck[];
  readonly queue: TodayQueue;
  readonly progressByCardId: ReadonlyMap<string, CardProgress>;
  readonly dueTomorrow: number;
  readonly unseenCount: number;
};

/** Cas d'usage de l'écran « Aujourd'hui ». */
export class TodayReview {
  readonly #dependencies: TodayReviewDependencies;

  constructor(dependencies: TodayReviewDependencies) {
    this.#dependencies = dependencies;
  }

  async loadToday(now: Date): Promise<TodaySnapshot> {
    const { deckSource, progressRepository, policy } = this.#dependencies;
    const [decks, progressList] = await Promise.all([deckSource.loadAll(), progressRepository.loadAll()]);
    const cards = decks.flatMap((deck) => deck.cards);
    const progressByCardId = new Map(progressList.map((progress) => [progress.cardId, progress]));

    return {
      decks,
      queue: composeTodayQueue(cards, progressByCardId, now, policy),
      progressByCardId,
      dueTomorrow: countDueTomorrow(progressByCardId, now),
      unseenCount: cards.filter((card) => !progressByCardId.has(card.id)).length,
    };
  }

  /** Prochaine échéance selon chaque note, pour l'afficher sur les boutons. */
  previewDueDates(card: Card, current: CardProgress | undefined, now: Date): Readonly<Record<Rating, Date>> {
    const outcomes = this.#dependencies.scheduler.previewOutcomes(card.id, current, now);
    return { again: outcomes.again.dueAt, hard: outcomes.hard.dueAt, good: outcomes.good.dueAt, easy: outcomes.easy.dueAt };
  }

  /** Enregistre la note donnée à une carte et renvoie sa nouvelle progression. */
  async rate(card: Card, current: CardProgress | undefined, rating: Rating, now: Date): Promise<CardProgress> {
    const next = this.#dependencies.scheduler.previewOutcomes(card.id, current, now)[rating];
    await this.#dependencies.progressRepository.save(next);
    return next;
  }

  async report(report: CardReport): Promise<void> {
    await this.#dependencies.cardReportRepository.save(report);
  }
}
