import { useState } from 'react';
import { AnswerGradingError } from '../../application/ports/answer-grader';
import type { Card } from '../../domain/deck';
import { ANSWER_TIME_LIMIT_SECONDS, type AnswerGrade } from '../../domain/interview';
import { FocusHeader } from '../shared/FocusHeader';
import { Icon } from '../shared/Icon';
import type { CardContext } from '../today/card-contexts';
import { KeyPointChecklist } from '../today/KeyPointChecklist';
import { QuestionTile } from '../today/QuestionTile';
import { SourceLink } from '../today/SourceLink';
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
  readonly onExit: () => void;
};

/** Une question d'entretien : réponse orale chronométrée, notes, puis correction. */
export function InterviewQuestion({
  card,
  context,
  position,
  total,
  canUseClaude,
  grade,
  onClaudeUnavailable,
  onDone,
  onExit,
}: InterviewQuestionProps) {
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
    <div className="focus">
      <FocusHeader
        tone="interview"
        closeLabel="Quitter l’entretien"
        onClose={onExit}
        stepLabel="Question"
        step={position}
        total={total}
        progress={(position - 1) / total}
      />
      <main className="focus__main">
        <div className={`review review--interview-${phase.kind}`}>
          <QuestionTile card={card} context={context} size={phase.kind === 'answering' ? 'hero' : 'compact'} tone="interview" />

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
              <div className="field">
                <label htmlFor="interview-answer" className="field__label field__label--large">
                  Note l’essentiel de ce que tu as dit
                </label>
                <p className="field__hint">Sur téléphone, la dictée du clavier va plus vite.</p>
                <textarea
                  id="interview-answer"
                  className="field__input field__input--answer"
                  rows={7}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  autoFocus
                />
              </div>
              {phase.error !== null && (
                <p className="form-error" role="alert">
                  {phase.error}
                </p>
              )}
              <div className="review__footer">
                {canUseClaude && (
                  <button type="submit" className="button button--primary button--block" disabled={answer.trim() === ''}>
                    Faire corriger par Claude
                  </button>
                )}
                <button
                  type="button"
                  className={canUseClaude ? 'button button--ghost button--block' : 'button button--primary button--block'}
                  onClick={() => setPhase({ kind: 'self-check', notice: null })}
                >
                  Me corriger avec la grille
                </button>
              </div>
            </form>
          )}

          {phase.kind === 'grading' && (
            <p className="tile grading" role="status">
              Claude corrige ta réponse… La première fois, l’appli te demande l’autorisation d’utiliser Claude.
            </p>
          )}

          {phase.kind === 'graded' && <GradeReport card={card} grade={phase.grade} />}
          {phase.kind === 'self-check' && <SelfCheck card={card} notice={phase.notice} />}

          {(phase.kind === 'graded' || phase.kind === 'self-check') && (
            <div className="review__footer">
              <button
                type="button"
                className="button button--primary button--block"
                onClick={() => onDone({ card, grade: phase.kind === 'graded' ? phase.grade : null })}
              >
                {position === total ? 'Voir le bilan' : 'Question suivante'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const RING_RADIUS = 100;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ENDING_SECONDS = 10;

function AnsweringTimer({ onFinish }: { readonly onFinish: (timeIsUp: boolean) => void }) {
  const durationMs = ANSWER_TIME_LIMIT_SECONDS * 1000;
  const remainingMs = useCountdown(durationMs, () => onFinish(true));
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const ringLength = (remainingMs / durationMs) * RING_CIRCUMFERENCE;

  return (
    <>
      <div className={remainingSeconds <= ENDING_SECONDS ? 'timer timer--ending' : 'timer'}>
        <div className="timer__ring" role="timer" aria-label={`${remainingSeconds} secondes restantes`}>
          <svg viewBox="0 0 230 230" aria-hidden="true" focusable="false">
            <circle className="timer__track" cx="115" cy="115" r={RING_RADIUS} fill="none" strokeWidth="14" />
            <circle
              className="timer__value"
              cx="115"
              cy="115"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${ringLength} ${RING_CIRCUMFERENCE}`}
              transform="rotate(-90 115 115)"
            />
          </svg>
          <p className="timer__clock" aria-hidden="true">
            <span className="timer__time">
              {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
            </span>
            <span className="timer__caption">restantes</span>
          </p>
        </div>
        <p className="hint">
          <Icon name="mic" size={18} />
          Réponds à voix haute, comme face au recruteur.
        </p>
      </div>
      <div className="review__footer">
        <button type="button" className="button button--primary button--block" onClick={() => onFinish(false)}>
          J’ai fini
        </button>
      </div>
    </>
  );
}

function GradeReport({ card, grade }: { readonly card: Card; readonly grade: AnswerGrade }) {
  const coveredCount = grade.coveredKeyPoints.length;

  return (
    <>
      <section className="tile score" aria-label="Correction">
        <div className="score__row">
          <p className="score__label">Points clés couverts</p>
          <p className="score__value">
            <span className="score__covered">{coveredCount}</span>
            <span className="score__expected"> / {card.keyPoints.length}</span>
          </p>
        </div>
        <div className="segments" aria-hidden="true">
          {card.keyPoints.map((keyPoint, index) => (
            <span key={keyPoint} className={index < coveredCount ? 'segments__item segments__item--on' : 'segments__item'} />
          ))}
        </div>
        {grade.comment !== '' && <p className="score__comment">{grade.comment}</p>}
      </section>
      {coveredCount > 0 && <VerdictList verdict="covered" title="Couvert" keyPoints={grade.coveredKeyPoints} />}
      {grade.missedKeyPoints.length > 0 && <VerdictList verdict="missed" title="Manqué" keyPoints={grade.missedKeyPoints} />}
      <section className="tile model-answer" aria-labelledby="model-answer-title">
        <h3 id="model-answer-title" className="tile__eyebrow">
          Réponse modèle · 30 s
        </h3>
        <p className="model-answer__text">{grade.modelAnswer}</p>
      </section>
      <SourceLink card={card} />
    </>
  );
}

type VerdictListProps = {
  readonly verdict: 'covered' | 'missed';
  readonly title: string;
  readonly keyPoints: readonly string[];
};

/** Points couverts ou manqués : la marque diffère par la forme (plein / contour), pas seulement par la couleur. */
function VerdictList({ verdict, title, keyPoints }: VerdictListProps) {
  return (
    <section className="tile" aria-labelledby={`verdict-${verdict}`}>
      <h3 id={`verdict-${verdict}`} className="tile__title">
        {title}
      </h3>
      <ul className="verdict-list">
        {keyPoints.map((keyPoint) => (
          <li key={keyPoint} className="verdict-list__item">
            <span className={`verdict-mark verdict-mark--${verdict}`} aria-hidden="true">
              <Icon name={verdict === 'covered' ? 'check' : 'minus'} size={15} strokeWidth={2.6} />
            </span>
            <span>{keyPoint}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SelfCheck({ card, notice }: { readonly card: Card; readonly notice: string | null }) {
  return (
    <>
      {notice !== null && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <KeyPointChecklist keyPoints={card.keyPoints} idPrefix={`interview-keypoints-${card.id}`} />
      <section className="tile model-answer" aria-labelledby="reference-answer-title">
        <h3 id="reference-answer-title" className="tile__eyebrow">
          Réponse de référence
        </h3>
        <p className="model-answer__text">{card.answer}</p>
      </section>
      <SourceLink card={card} />
    </>
  );
}
