import type { AnswerGrade } from '../../domain/interview';
import { SimpleFocusHeader } from '../shared/FocusHeader';
import type { QuestionResult } from './InterviewQuestion';

type GradedResult = QuestionResult & { readonly grade: AnswerGrade };

type InterviewSummaryProps = {
  readonly results: readonly QuestionResult[];
  readonly onRestart: () => void;
  readonly onExit: () => void;
};

/** Bilan de l'entretien : points clés couverts au total, puis question par question. */
export function InterviewSummary({ results, onRestart, onExit }: InterviewSummaryProps) {
  const graded = results.filter((result): result is GradedResult => result.grade !== null);
  const covered = graded.reduce((total, result) => total + result.grade.coveredKeyPoints.length, 0);
  const expected = graded.reduce((total, result) => total + result.card.keyPoints.length, 0);

  return (
    <div className="focus">
      <SimpleFocusHeader closeLabel="Retour à l’accueil" onClose={onExit} title="Mode entretien" />
      <main className="focus__main">
        <div className="review review--summary" aria-live="polite">
          <section className="hero-tile hero-tile--interview" aria-labelledby="interview-summary-title">
            <h2 id="interview-summary-title" className="hero-tile__eyebrow">
              Entretien terminé
            </h2>
            {graded.length > 0 ? (
              <p className="hero-tile__figure">
                <span className="hero-tile__number">{covered}</span>
                <span className="hero-tile__aside">
                  <span className="hero-tile__unit">/ {expected}</span>
                  <span className="hero-tile__caption">points clés couverts</span>
                </span>
              </p>
            ) : (
              <p className="hero-tile__figure">
                <span className="hero-tile__number">{results.length}</span>
                <span className="hero-tile__unit">questions auto-évaluées</span>
              </p>
            )}
          </section>

          <ol className="results">
            {results.map(({ card, grade }, index) => (
              <li key={card.id} className="results__item">
                <span className="results__rank" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="results__question">{card.question}</span>
                <span className={grade === null ? 'results__score results__score--self' : 'results__score'}>
                  {grade === null ? 'auto-évaluée' : `${grade.coveredKeyPoints.length} / ${card.keyPoints.length}`}
                </span>
              </li>
            ))}
          </ol>

          <div className="review__footer">
            <button type="button" className="button button--primary button--block" onClick={onRestart}>
              Nouvel entretien
            </button>
            <button type="button" className="button button--ghost button--block" onClick={onExit}>
              Retour à l’accueil
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
