import type { Card } from './deck';
import type { CardProgress } from './review';

export type TodayPolicy = {
  readonly newCardsPerDay: number;
};

/** File de révision du jour. La carte courante est la première de `pending`. */
export type TodayQueue = {
  readonly pending: readonly Card[];
  readonly reviewedCount: number;
};

export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function startOfNextDay(date: Date): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Compose la file du jour : d'abord les cartes déjà vues dont l'échéance tombe
 * avant la fin de la journée (les plus en retard en tête), puis de nouvelles
 * cartes jusqu'à la limite quotidienne, par difficulté puis dans l'ordre du deck.
 */
export function composeTodayQueue(
  cards: readonly Card[],
  progressByCardId: ReadonlyMap<string, CardProgress>,
  now: Date,
  policy: TodayPolicy,
): TodayQueue {
  const endOfToday = startOfNextDay(now);

  const dueCards = cards
    .flatMap((card) => {
      const progress = progressByCardId.get(card.id);
      return progress !== undefined && progress.dueAt < endOfToday ? [{ card, dueAt: progress.dueAt }] : [];
    })
    .sort((first, second) => first.dueAt.getTime() - second.dueAt.getTime())
    .map(({ card }) => card);

  const newCards = cards
    .map((card, deckPosition) => ({ card, deckPosition }))
    .filter(({ card }) => !progressByCardId.has(card.id))
    .sort((first, second) => first.card.difficulty - second.card.difficulty || first.deckPosition - second.deckPosition)
    .slice(0, remainingNewCards(progressByCardId, now, policy))
    .map(({ card }) => card);

  return { pending: [...dueCards, ...newCards], reviewedCount: 0 };
}

function remainingNewCards(progressByCardId: ReadonlyMap<string, CardProgress>, now: Date, policy: TodayPolicy): number {
  const today = startOfDay(now);
  const introducedToday = [...progressByCardId.values()].filter((progress) => progress.introducedAt >= today).length;
  return Math.max(0, policy.newCardsPerDay - introducedToday);
}

/**
 * Retire la carte courante après sa révision. Elle revient en fin de file si
 * sa prochaine échéance tombe encore aujourd'hui (étapes d'apprentissage).
 */
export function advanceTodayQueue(queue: TodayQueue, nextDueAt: Date, now: Date): TodayQueue {
  const [current, ...rest] = queue.pending;
  if (current === undefined) return queue;

  const comesBackToday = nextDueAt < startOfNextDay(now);
  return {
    pending: comesBackToday ? [...rest, current] : rest,
    reviewedCount: queue.reviewedCount + 1,
  };
}

/** Nombre de cartes déjà vues à revoir demain. */
export function countDueTomorrow(progressByCardId: ReadonlyMap<string, CardProgress>, now: Date): number {
  const tomorrow = startOfNextDay(now);
  const dayAfterTomorrow = startOfNextDay(tomorrow);
  return [...progressByCardId.values()].filter((progress) => progress.dueAt >= tomorrow && progress.dueAt < dayAfterTomorrow).length;
}
