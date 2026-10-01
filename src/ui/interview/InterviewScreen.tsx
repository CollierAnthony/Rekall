import { useState } from 'react';
import type { InterviewPractice } from '../../application/interview-practice';
import type { Card } from '../../domain/deck';
import { ANSWER_TIME_LIMIT_SECONDS, QUESTIONS_PER_INTERVIEW } from '../../domain/interview';
import type { CardProgress } from '../../domain/review';
import { SimpleFocusHeader } from '../shared/FocusHeader';
import { Icon } from '../shared/Icon';
import type { CardContext } from '../today/card-contexts';
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
  readonly onExit: () => void;
};

/** Mode entretien, en mode focus : intro, questions chronométrées, bilan. */
export function InterviewScreen({ interviewPractice, cards, progressByCardId, cardContexts, onExit }: InterviewScreenProps) {
  const [step, setStep] = useState<InterviewStep>({ kind: 'intro' });
  // Passe à false si Claude devient indisponible pendant la visite (autorisation refusée, par exemple).
  const [canUseClaude, setCanUseClaude] = useState(interviewPractice.canGrade);

  function start(): void {
    setStep({ kind: 'question', questions: interviewPractice.drawQuestions(cards, progressByCardId), index: 0, results: [] });
    window.scrollTo({ top: 0 });
  }

  function recordResult(result: QuestionResult): void {
    setStep((current) => {
      if (current.kind !== 'question') return current;
      const results = [...current.results, result];
      return current.index + 1 < current.questions.length ? { ...current, index: current.index + 1, results } : { kind: 'done', results };
    });
    window.scrollTo({ top: 0 });
  }

  if (step.kind === 'done') return <InterviewSummary results={step.results} onRestart={start} onExit={onExit} />;

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
          onExit={onExit}
        />
      );
    }
  }

  const rules = [
    `${QUESTIONS_PER_INTERVIEW} questions tirées au hasard parmi les ${progressByCardId.size} cartes que tu as déjà vues.`,
    `${ANSWER_TIME_LIMIT_SECONDS} secondes par question pour répondre à voix haute, comme face à un recruteur.`,
    canUseClaude
      ? 'Tu notes ensuite l’essentiel de ta réponse, et Claude la corrige à partir des points clés.'
      : 'Tu te corriges ensuite avec la grille des points clés.',
    'Les entretiens ne changent rien à tes révisions du jour.',
  ];

  return (
    <div className="focus">
      <SimpleFocusHeader closeLabel="Retour à l’accueil" onClose={onExit} title="Mode entretien" />
      <main className="focus__main">
        <div className="review review--intro">
          <section className="hero-tile hero-tile--interview intro-tile" aria-labelledby="interview-intro-title">
            <Icon name="timer" size={40} />
            <h1 id="interview-intro-title" className="intro-tile__title">
              Simule un entretien
            </h1>
            <ol className="rules">
              {rules.map((rule, index) => (
                <li key={rule} className="rules__item">
                  <span className="rules__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </section>
          <div className="review__footer">
            <button type="button" className="button button--primary button--block" onClick={start}>
              Commencer l’entretien
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
