import { createEmptyCard, fsrs, Rating as FsrsRating, State, type Card as FsrsCard, type FSRS } from 'ts-fsrs';
import { z } from 'zod';
import type { Scheduler } from '../../application/ports/scheduler';
import type { CardProgress, Rating, SchedulerState } from '../../domain/review';

type Phase = 'learning' | 'review' | 'relearning';

const fsrsStateSchema = z.strictObject({
  algorithm: z.literal('fsrs'),
  phase: z.enum(['learning', 'review', 'relearning']),
  stability: z.number(),
  difficulty: z.number(),
  scheduledDays: z.number(),
  learningSteps: z.number(),
});

/**
 * Adaptateur de la librairie ts-fsrs (paramètres par défaut : 90 % de rétention visée,
 * étapes d'apprentissage de 1 et 10 minutes). Seul endroit du code qui connaît FSRS.
 */
export class FsrsScheduler implements Scheduler {
  readonly #algorithm: FSRS;

  constructor(algorithm: FSRS = fsrs()) {
    this.#algorithm = algorithm;
  }

  previewOutcomes(cardId: string, current: CardProgress | undefined, now: Date): Readonly<Record<Rating, CardProgress>> {
    const preview = this.#algorithm.repeat(current === undefined ? createEmptyCard(now) : toFsrsCard(current), now);

    const toProgress = (card: FsrsCard): CardProgress => ({
      cardId,
      introducedAt: current?.introducedAt ?? now,
      lastReviewedAt: now,
      dueAt: card.due,
      reviewCount: card.reps,
      lapseCount: card.lapses,
      schedulerState: toSchedulerState(card),
    });

    return {
      again: toProgress(preview[FsrsRating.Again].card),
      hard: toProgress(preview[FsrsRating.Hard].card),
      good: toProgress(preview[FsrsRating.Good].card),
      easy: toProgress(preview[FsrsRating.Easy].card),
    };
  }
}

function toFsrsCard(progress: CardProgress): FsrsCard {
  const state = fsrsStateSchema.parse(progress.schedulerState);
  return {
    due: progress.dueAt,
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: 0, // déprécié : ts-fsrs le recalcule à partir de last_review
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: progress.reviewCount,
    lapses: progress.lapseCount,
    state: toFsrsState(state.phase),
    last_review: progress.lastReviewedAt,
  };
}

function toSchedulerState(card: FsrsCard): SchedulerState {
  return {
    algorithm: 'fsrs',
    phase: toPhase(card.state),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
  };
}

function toFsrsState(phase: Phase): State {
  switch (phase) {
    case 'learning':
      return State.Learning;
    case 'review':
      return State.Review;
    case 'relearning':
      return State.Relearning;
  }
}

function toPhase(state: State): Phase {
  switch (state) {
    case State.Learning:
      return 'learning';
    case State.Review:
      return 'review';
    case State.Relearning:
      return 'relearning';
    case State.New:
      throw new Error('Une carte révisée ne peut pas rester à l’état New');
  }
}
