import type { CardProgress, Rating } from '../../domain/review';

/** Algorithme de répétition espacée. */
export interface Scheduler {
  /**
   * Progression obtenue pour chacune des notes possibles, si la carte est révisée à `now`.
   * `current` absent : la carte n'a jamais été révisée.
   */
  previewOutcomes(cardId: string, current: CardProgress | undefined, now: Date): Readonly<Record<Rating, CardProgress>>;
}
