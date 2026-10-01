import { useState } from 'react';
import type { InterviewPractice } from '../../application/interview-practice';
import type { Card } from '../../domain/deck';
import { ANSWER_TIME_LIMIT_SECONDS, QUESTIONS_PER_INTERVIEW } from '../../domain/interview';
import type { CardProgress } from '../../domain/review';
import type { CardContext } from '../today/ReviewCard';
import { InterviewQuestion, type QuestionResult } from './InterviewQuestion';
import { InterviewSummary } from './InterviewSummary';

type InterviewStep =
  | { readonly kind: 'intro' }
  | {
      readonly kind: 'question';
      readonly questions: readonly Card[];
      readonly index: number;
      readonly results: readonly QuestionResult[];
    }
  | { readonly kind: 'done'; readonly results: readonly QuestionResult[] };

type InterviewScreenProps = {
  readonly interviewPractice: InterviewPractice;
  readonly cards: readonly Card[];
  readonly progressByCardId: ReadonlyMap<string, CardProgress>;
  readonly cardContexts: ReadonlyMap<string, CardContext>;
};

export function InterviewScreen({ interviewPractice, cards, progressByCardId, cardContexts }: InterviewScreenProps) {
  const [step, setStep] = useState<InterviewStep>({ kind: 'intro' });
  // Passe à false si Claude devient indisponible pendant la visite (autorisation refusée, par exemple).
  const [canUseClaude, setCanUseClaude] = useState(interviewPractice.canGrade);

  function start(): void {
    setStep({ kind: 'question', questions: interviewPractice.drawQuestions(cards, progressByCardId), index: 0, results: [] });
  }

  function recordResult(result: QuestionResult): void {
    setStep((current) => {
      if (current.kind !== 'question') return current;
      const results = [...current.results, result];
      return current.index + 1 < current.questions.length ? { ...current, index: current.index + 1, results } : { kind: 'done', results };
    });
  }

  if (step.kind === 'done') return <InterviewSummary results={step.results} onRestart={start} />;

  if (step.kind === 'question') {
    const card = step.questions[step.index];
    const context = card === undefined ? undefined : cardContexts.get(card.id);
    if (card !== undefined && context !== undefined) {
      return (
        <InterviewQuestion
          key={`${step.index}:${card.id}`}
          card={card}
          context={context}
          position={step.index + 1}
          total={step.questions.length}
          canUseClaude={canUseClaude}
          grade={(answer) => interviewPractice.grade(card, answer)}
          onClaudeUnavailable={() => setCanUseClaude(false)}
          onDone={recordResult}
        />
      );
    }
  }

  return (
    <section className="interview-intro">
      <h2 className="interview-intro__title">Simule un entretien</h2>
      <ul className="interview-intro__rules">
        <li>
          {QUESTIONS_PER_INTERVIEW} questions tirées au hasard parmi les {progressByCardId.size} cartes que tu as déjà vues.
        </li>
        <li>{ANSWER_TIME_LIMIT_SECONDS} secondes par question pour répondre à voix haute, comme face à un recruteur.</li>
        <li>
          {canUseClaude
            ? 'Tu notes ensuite l’essentiel de ta réponse, et Claude la corrige à partir des points clés.'
            : 'Tu te corriges ensuite avec la grille des points clés.'}
        </li>
        <li>Les entretiens ne changent rien à tes révisions du jour.</li>
      </ul>
      <button type="button" className="button button--primary" onClick={start}>
        Commencer l’entretien
      </button>
    </section>
  );
}
