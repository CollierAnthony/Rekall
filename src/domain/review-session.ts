import type { Card } from './deck';
import type { CardProgress } from './review';
import { advanceTodayQueue, countDueTomorrow, type TodayQueue } from './today-queue';

/**
 * Session de révision en cours : la file du jour, la progression connue, et le moment où la
 * réponse de la carte courante a été révélée (null tant qu'elle ne l'est pas).
 */
export type ReviewSession = {
  readonly queue: TodayQueue;
  readonly progressByCardId: ReadonlyMap<string, CardProgress>;
  /** Référence des intervalles proposés à la notation : ceux qu'on affiche sont ceux qu'on enregistre. */
  readonly revealedAt: Date | null;
};

export function startReviewSession(queue: TodayQueue, progressByCardId: ReadonlyMap<string, CardProgress>): ReviewSession {
  return { queue, progressByCardId, revealedAt: null };
}

export function currentCardOf(session: ReviewSession): Card | undefined {
  return session.queue.pending[0];
}

/** Révèle la réponse de la carte courante ; révéler deux fois garde le premier instant. */
export function revealAnswer(session: ReviewSession, at: Date): ReviewSession {
  if (currentCardOf(session) === undefined || session.revealedAt !== null) return session;
  return { ...session, revealedAt: at };
}

/**
 * Enregistre la nouvelle progression de la carte courante et passe à la suivante.
 * Ignoré si la réponse n'a pas été révélée ou si la progression concerne une autre carte :
 * une note qui arrive en retard (double clic, réponse lente du stockage) ne fait pas sauter une carte.
 */
export function recordRating(session: ReviewSession, progress: CardProgress, at: Date): ReviewSession {
  const current = currentCardOf(session);
  if (current === undefined || current.id !== progress.cardId || session.revealedAt === null) return session;
  return {
    queue: advanceTodayQueue(session.queue, progress.dueAt, at),
    progressByCardId: new Map(session.progressByCardId).set(progress.cardId, progress),
    revealedAt: null,
  };
}

export type ReviewSessionSummary = {
  readonly reviewedCount: number;
  readonly remainingNewCount: number;
  readonly remainingReviewCount: number;
  readonly dueTomorrow: number;
  readonly unseenCount: number;
  readonly seenCardCount: number;
};

/** Compteurs affichés par l'accueil et la session ; `now` fixe la journée de révision de référence. */
export function summarizeReviewSession(session: ReviewSession, cards: readonly Card[], now: Date): ReviewSessionSummary {
  const isNew = (card: Card): boolean => !session.progressByCardId.has(card.id);
  const remainingNewCount = session.queue.pending.filter(isNew).length;
  return {
    reviewedCount: session.queue.reviewedCount,
    remainingNewCount,
    remainingReviewCount: session.queue.pending.length - remainingNewCount,
    dueTomorrow: countDueTomorrow(session.progressByCardId, now),
    unseenCount: cards.filter(isNew).length,
    seenCardCount: session.progressByCardId.size,
  };
}
