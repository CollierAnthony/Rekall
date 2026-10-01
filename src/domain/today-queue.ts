import type { Card, Deck } from './deck';
import type { CardProgress } from './review';

export type TodayPolicy = {
  readonly newCardsPerDay: number;
};

/** File de révision du jour. La carte courante est la première de `pending`. */
export type TodayQueue = {
  readonly pending: readonly Card[];
  readonly reviewedCount: number;
};

/**
 * Heure locale à laquelle commence une journée de révision (comme Anki).
 * Une révision faite avant 4 h compte pour la veille : réviser à 1 h du matin
 * prolonge la journée de la veille au lieu d'entamer le quota du nouveau jour.
 */
export const REVIEW_DAY_START_HOUR = 4;

/**
 * Début de la journée de révision qui contient `date` : 4 h le jour même si
 * `date` est à 4 h ou après, sinon 4 h la veille. Calculé en heure locale avec
 * `setHours` / `setDate` pour rester juste aux changements d'heure.
 */
export function startOfReviewDay(date: Date): Date {
  const start = new Date(date);
  const isBeforeDayStart = date.getHours() < REVIEW_DAY_START_HOUR;
  start.setHours(REVIEW_DAY_START_HOUR, 0, 0, 0);
  if (isBeforeDayStart) start.setDate(start.getDate() - 1);
  return start;
}

/** Début de la journée de révision suivante, c'est-à-dire la fin de celle qui contient `date`. */
export function startOfNextReviewDay(date: Date): Date {
  const next = startOfReviewDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Compose la file du jour : d'abord les cartes déjà vues dont l'échéance tombe
 * avant la fin de la journée de révision (les plus en retard en tête), puis de
 * nouvelles cartes jusqu'à la limite quotidienne.
 *
 * Les nouvelles cartes sortent deck par deck, dans l'ordre de l'index : un deck
 * n'en fournit que lorsque les précédents sont entièrement vus. Dans un deck,
 * elles sortent par difficulté, puis dans l'ordre du fichier.
 */
export function composeTodayQueue(
  decks: readonly Deck[],
  progressByCardId: ReadonlyMap<string, CardProgress>,
  now: Date,
  policy: TodayPolicy,
): TodayQueue {
  const endOfReviewDay = startOfNextReviewDay(now);
  const cards = decks.flatMap((deck) => deck.cards);

  const dueCards = cards
    .flatMap((card) => {
      const progress = progressByCardId.get(card.id);
      return progress !== undefined && progress.dueAt < endOfReviewDay ? [{ card, dueAt: progress.dueAt }] : [];
    })
    .sort((first, second) => first.dueAt.getTime() - second.dueAt.getTime())
    .map(({ card }) => card);

  const newCards = decks
    .flatMap((deck) => unseenCardsInIntroductionOrder(deck, progressByCardId))
    .slice(0, remainingNewCards(progressByCardId, now, policy));

  return { pending: [...dueCards, ...newCards], reviewedCount: 0 };
}

/** Cartes jamais vues d'un deck, par difficulté puis dans l'ordre du fichier. */
function unseenCardsInIntroductionOrder(deck: Deck, progressByCardId: ReadonlyMap<string, CardProgress>): Card[] {
  return deck.cards
    .map((card, filePosition) => ({ card, filePosition }))
    .filter(({ card }) => !progressByCardId.has(card.id))
    .sort((first, second) => first.card.difficulty - second.card.difficulty || first.filePosition - second.filePosition)
    .map(({ card }) => card);
}

/** Nouvelles cartes encore autorisées : la limite moins celles introduites depuis le début de la journée de révision. */
function remainingNewCards(progressByCardId: ReadonlyMap<string, CardProgress>, now: Date, policy: TodayPolicy): number {
  const reviewDayStart = startOfReviewDay(now);
  const introducedThisReviewDay = [...progressByCardId.values()].filter(
    (progress) => progress.introducedAt >= reviewDayStart,
  ).length;
  return Math.max(0, policy.newCardsPerDay - introducedThisReviewDay);
}

/**
 * Retire la carte courante après sa révision. Elle revient en fin de file si
 * sa prochaine échéance tombe encore dans la journée de révision en cours
 * (étapes d'apprentissage), y compris après minuit et avant 4 h.
 */
export function advanceTodayQueue(queue: TodayQueue, nextDueAt: Date, now: Date): TodayQueue {
  const [current, ...rest] = queue.pending;
  if (current === undefined) return queue;

  const comesBackThisReviewDay = nextDueAt < startOfNextReviewDay(now);
  return {
    pending: comesBackThisReviewDay ? [...rest, current] : rest,
    reviewedCount: queue.reviewedCount + 1,
  };
}

/** Nombre de cartes déjà vues à revoir demain, c'est-à-dire pendant la journée de révision suivante (de 4 h à 4 h). */
export function countDueTomorrow(progressByCardId: ReadonlyMap<string, CardProgress>, now: Date): number {
  const nextReviewDayStart = startOfNextReviewDay(now);
  const followingReviewDayStart = startOfNextReviewDay(nextReviewDayStart);
  return [...progressByCardId.values()].filter(
    (progress) => progress.dueAt >= nextReviewDayStart && progress.dueAt < followingReviewDayStart,
  ).length;
}
