import type { CardProgress } from './review';
import { startOfNextReviewDay } from './today-queue';

/** Où en est une carte dans la répétition espacée. */
export type CardStatus =
  | { readonly kind: 'new' }
  /** La carte revient pendant la journée de révision en cours. */
  | { readonly kind: 'due' }
  | { readonly kind: 'scheduled'; readonly dueAt: Date };

export function cardStatus(progress: CardProgress | undefined, now: Date): CardStatus {
  if (progress === undefined) return { kind: 'new' };
  return progress.dueAt < startOfNextReviewDay(now) ? { kind: 'due' } : { kind: 'scheduled', dueAt: progress.dueAt };
}
