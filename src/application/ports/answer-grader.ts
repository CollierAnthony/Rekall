import type { Card } from '../../domain/deck';
import type { AnswerGrade } from '../../domain/interview';

/** Corrige une réponse d'entretien (ce que le candidat a noté ou dicté) au regard des points clés de la carte. */
export interface AnswerGrader {
  grade(card: Card, answer: string): Promise<AnswerGrade>;
}

/**
 * `unavailable` : la correction est impossible pour toute la visite (autorisation refusée, compte sans Claude) ;
 * `failed` : échec ponctuel, l'utilisateur peut réessayer.
 */
export type AnswerGradingFailure = 'unavailable' | 'failed';

export class AnswerGradingError extends Error {
  readonly failure: AnswerGradingFailure;

  constructor(failure: AnswerGradingFailure, message: string) {
    super(message);
    this.name = 'AnswerGradingError';
    this.failure = failure;
  }
}
