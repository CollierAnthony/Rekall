import type { Card } from '../domain/deck';
import { drawInterviewCards, QUESTIONS_PER_INTERVIEW, type AnswerGrade, type RandomSource } from '../domain/interview';
import type { CardProgress } from '../domain/review';
import { AnswerGradingError, type AnswerGrader } from './ports/answer-grader';

/**
 * Cas d'usage du mode entretien. C'est de l'entraînement : il ne touche pas à la
 * répétition espacée, pour ne pas fausser les intervalles.
 */
export class InterviewPractice {
  readonly #grader: AnswerGrader | null;
  readonly #random: RandomSource;

  constructor(grader: AnswerGrader | null, random: RandomSource = Math.random) {
    this.#grader = grader;
    this.#random = random;
  }

  /** false quand aucun correcteur n'est disponible : l'utilisateur se corrige avec la grille des points clés. */
  get canGrade(): boolean {
    return this.#grader !== null;
  }

  drawQuestions(cards: readonly Card[], progressByCardId: ReadonlyMap<string, CardProgress>): Card[] {
    return drawInterviewCards(cards, new Set(progressByCardId.keys()), QUESTIONS_PER_INTERVIEW, this.#random);
  }

  async grade(card: Card, answer: string): Promise<AnswerGrade> {
    if (this.#grader === null) throw new AnswerGradingError('unavailable', 'Aucun correcteur disponible');
    return this.#grader.grade(card, answer);
  }
}
