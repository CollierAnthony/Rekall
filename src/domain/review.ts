export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const RATINGS: readonly Rating[] = ['again', 'hard', 'good', 'easy'];

/**
 * État propre à l'algorithme de répétition espacée (FSRS aujourd'hui).
 * Opaque pour le domaine : seul l'adaptateur Scheduler le lit et l'écrit,
 * ce qui permet de changer d'algorithme sans toucher au domaine.
 */
export type SchedulerState = Readonly<Record<string, unknown>>;

/** Où en est l'utilisateur sur une carte. Absente tant que la carte n'a jamais été révisée. */
export type CardProgress = {
  readonly cardId: string;
  /** Date de la première révision : sert à compter les nouvelles cartes du jour. */
  readonly introducedAt: Date;
  readonly lastReviewedAt: Date;
  readonly dueAt: Date;
  readonly reviewCount: number;
  readonly lapseCount: number;
  readonly schedulerState: SchedulerState;
};
