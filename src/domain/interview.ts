import type { Card } from './deck';

/** Nombre de cartes déjà vues à partir duquel le mode entretien apparaît. */
export const INTERVIEW_UNLOCK_THRESHOLD = 20;

export const QUESTIONS_PER_INTERVIEW = 5;

/** Temps de réponse orale par question, en secondes. */
export const ANSWER_TIME_LIMIT_SECONDS = 60;

export function isInterviewUnlocked(seenCardCount: number): boolean {
  return seenCardCount >= INTERVIEW_UNLOCK_THRESHOLD;
}

/** Nombre aléatoire dans [0, 1[ ; injecté pour que le tirage soit testable. */
export type RandomSource = () => number;

/** Tire au hasard, sans doublon, jusqu'à `count` cartes parmi celles déjà vues (mélange de Fisher-Yates). */
export function drawInterviewCards(
  cards: readonly Card[],
  seenCardIds: ReadonlySet<string>,
  count: number,
  random: RandomSource,
): Card[] {
  const pool = cards.filter((card) => seenCardIds.has(card.id));
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = pool[index];
    const other = pool[swapIndex];
    if (current === undefined || other === undefined) continue;
    pool[index] = other;
    pool[swapIndex] = current;
  }
  return pool.slice(0, count);
}

/** Correction d'une réponse d'entretien, rapportée aux points clés de la carte. */
export type AnswerGrade = {
  readonly coveredKeyPoints: readonly string[];
  readonly missedKeyPoints: readonly string[];
  /** Ce qui manquait de plus important (ou ce qui était faux), en une ou deux phrases. */
  readonly comment: string;
  /** Réponse modèle, dicible en 30 secondes environ. */
  readonly modelAnswer: string;
};

/**
 * Construit la correction à partir des numéros (base 0) des points clés couverts.
 * Les numéros hors limites ou en double sont ignorés : ils viennent d'un correcteur externe.
 */
export function gradeFromCoveredIndexes(
  card: Card,
  coveredIndexes: readonly number[],
  comment: string,
  modelAnswer: string,
): AnswerGrade {
  const covered = new Set(coveredIndexes.filter((index) => Number.isInteger(index) && index >= 0 && index < card.keyPoints.length));
  return {
    coveredKeyPoints: card.keyPoints.filter((_, index) => covered.has(index)),
    missedKeyPoints: card.keyPoints.filter((_, index) => !covered.has(index)),
    comment,
    modelAnswer,
  };
}
