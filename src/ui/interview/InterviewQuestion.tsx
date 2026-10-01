import { useState } from 'react';
import { AnswerGradingError } from '../../application/ports/answer-grader';
import type { Card } from '../../domain/deck';
import { ANSWER_TIME_LIMIT_SECONDS, type AnswerGrade } from '../../domain/interview';
import { KeyPointChecklist } from '../today/KeyPointChecklist';
import type { CardContext } from '../today/ReviewCard';
import { useCountdown } from './useCountdown';

/** Résultat d'une question ; `grade` vaut null quand l'utilisateur s'est corrigé avec la grille. */
export type QuestionResult = {
  readonly card: Card;
  readonly grade: AnswerGrade | null;
};

type Phase =
  | { readonly kind: 'answering' }
  | { readonly kind: 'writing'; readonly timeIsUp: boolean; readonly error: string | null }
  | { readonly kind: 'grading' }
  | { readonly kind: 'graded'; readonly grade: AnswerGrade }
  | { readonly kind: 'self-check'; readonly notice: string | null };

type InterviewQuestionProps = {
  readonly card: Card;
  readonly context: CardContext;
  readonly position: number;
  readonly total: number;
  readonly canUseClaude: boolean;
  readonly grade: (answer: string) => Promise<AnswerGrade>;
  readonly onClaudeUnavailable: () => void;
  readonly onDone: (result: QuestionResult) => void;
};

/** Une question d'entretien : réponse orale chronométrée, notes, puis correction. */
export function InterviewQuestion({ card, context, position, total, canUseClaude, grade, onClaudeUnavailable, onDone }: InterviewQuestionProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' });
  const [answer, setAnswer] = useState('');

  async function requestGrade(): Promise<void> {
    setPhase({ kind: 'grading' });
    try {
      setPhase({ kind: 'graded', grade: await grade(answer.trim()) });
    } catch (error) {
      if (error instanceof AnswerGradingError && error.failure === 'unavailable') {
        onClaudeUnavailable();
        setPhase({ kind: 'self-check', notice: 'La correction par Claude n’est pas disponible : corrige-toi avec la grille.' });
        return;
      }
      console.error('Correction impossible', error);
      setPhase({ kind: 'writing', timeIsUp: false, error: 'La correction a échoué. Réessaie, ou corrige-toi avec la grille.' });
    }
  }

  return (
    <article className="flashcard interview-question" aria-labelledby={`interview-question-${card.id}`}>
      <div className="flashcard__meta">
        <span className="flashcard__module">
          Question {position} sur {total} · {context.moduleTitle}
        </span>
      </div>
      <h2 id={`interview-question-${card.id}`} className="flashcard__question">
        {card.question}
      </h2>
      {card.code !== undefined && (
        <pre className="code">
          <code>{card.code}</code>
        </pre>
      )}

      {phase.kind === 'answering' && <AnsweringTimer onFinish={(timeIsUp) => setPhase({ kind: 'writing', timeIsUp, error: null })} />}

      {phase.kind === 'writing' && (
        <form
          className="interview-answer"
          onSubmit={(event) => {
            event.preventDefault();
            if (canUseClaude && answer.trim() !== '') void requestGrade();
          }}
        >
          {phase.timeIsUp && <p className="notice">Temps écoulé.</p>}
          <label htmlFor="interview-answer" className="interview-answer__label">
            Note l’essentiel de ce que tu as dit
          </label>
          <p className="interview-answer__hint">Sur téléphone, la dictée du clavier va plus vite.</p>
          <textarea
            id="interview-answer"
            className="interview-answer__field"
            rows={5}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            autoFocus
          />
          {phase.error !== null && (
            <p className="flashcard__error" role="alert">
              {phase.error}
            </p>
          )}
          <div className="interview-answer__actions">
            {canUseClaude && (
              <button type="submit" className="button button--primary" disabled={answer.trim() === ''}>
                Faire corriger par Claude
              </button>
            )}
            <button
              type="button"
              className={canUseClaude ? 'button button--quiet' : 'button button--primary'}
              onClick={() => setPhase({ kind: 'self-check', notice: null })}
            >
              Me corriger avec la grille
            </button>
          </div>
        </form>
      )}

      {phase.kind === 'grading' && (
        <p className="notice" role="status">
          Claude corrige ta réponse… La première fois, l’appli te demande l’autorisation d’utiliser Claude.
        </p>
      )}

      {phase.kind === 'graded' && <GradeReport card={card} grade={phase.grade} />}
      {phase.kind === 'self-check' && <SelfCheck card={card} notice={phase.notice} />}

      {(phase.kind === 'graded' || phase.kind === 'self-check') && (
        <button
          type="button"
          className="button button--primary interview-question__next"
          onClick={() => onDone({ card, grade: phase.kind === 'graded' ? phase.grade : null })}
        >
          {position === total ? 'Voir le bilan' : 'Question suivante'}
        </button>
      )}
    </article>
  );
}

function AnsweringTimer({ onFinish }: { readonly onFinish: (timeIsUp: boolean) => void }) {
  const durationMs = ANSWER_TIME_LIMIT_SECONDS * 1000;
  const remainingMs = useCountdown(durationMs, () => onFinish(true));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="timer">
      <p className="timer__hint">Réponds à voix haute, comme face au recruteur.</p>
      <p className="timer__clock" role="timer" aria-label={`${remainingSeconds} secondes restantes`}>
        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
      </p>
      <div className="timer__track" aria-hidden="true">
        <div className="timer__fill" style={{ width: `${(remainingMs / durationMs) * 100}%` }} />
      </div>
      <button type="button" className="button button--secondary" onClick={() => onFinish(false)}>
        J’ai fini
      </button>
    </div>
  );
}

function GradeReport({ card, grade }: { readonly card: Card; readonly grade: AnswerGrade }) {
  return (
    <section className="grade" aria-label="Correction">
      <p className="grade__score">
        Points clés couverts : <strong>{grade.coveredKeyPoints.length}</strong> / {card.keyPoints.length}
      </p>
      {grade.comment !== '' && <p className="grade__comment">{grade.comment}</p>}
      {grade.coveredKeyPoints.length > 0 && (
        <>
          <h3 className="answer__heading">Couvert</h3>
          <ul className="grade__list grade__list--covered">
            {grade.coveredKeyPoints.map((keyPoint) => (
              <li key={keyPoint}>{keyPoint}</li>
            ))}
          </ul>
        </>
      )}
      {grade.missedKeyPoints.length > 0 && (
        <>
          <h3 className="answer__heading">Manqué</h3>
          <ul className="grade__list grade__list--missed">
            {grade.missedKeyPoints.map((keyPoint) => (
              <li key={keyPoint}>{keyPoint}</li>
            ))}
          </ul>
        </>
      )}
      <h3 className="answer__heading">Réponse modèle (30 s)</h3>
      <p className="answer__text">{grade.modelAnswer}</p>
      <SourceLink card={card} />
    </section>
  );
}

function SelfCheck({ card, notice }: { readonly card: Card; readonly notice: string | null }) {
  return (
    <section className="answer" aria-label="Grille de correction">
      {notice !== null && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <h3 className="answer__heading">Points clés</h3>
      <p className="answer__note">Coche ce que tu as dit.</p>
      <KeyPointChecklist keyPoints={card.keyPoints} idPrefix="interview-key-point" />
      <h3 className="answer__heading">Réponse de référence</h3>
      <p className="answer__text">{card.answer}</p>
      <SourceLink card={card} />
    </section>
  );
}

function SourceLink({ card }: { readonly card: Card }) {
  return (
    <p className="answer__source">
      Source :{' '}
      <a href={card.source.url} target="_blank" rel="noreferrer">
        {card.source.title}
      </a>
    </p>
  );
}
