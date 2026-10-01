import type { AnswerGrade } from '../../domain/interview';
import type { QuestionResult } from './InterviewQuestion';

type GradedResult = QuestionResult & { readonly grade: AnswerGrade };

type InterviewSummaryProps = {
  readonly results: readonly QuestionResult[];
  readonly onRestart: () => void;
};

export function InterviewSummary({ results, onRestart }: InterviewSummaryProps) {
  const graded = results.filter((result): result is GradedResult => result.grade !== null);
  const covered = graded.reduce((total, result) => total + result.grade.coveredKeyPoints.length, 0);
  const expected = graded.reduce((total, result) => total + result.card.keyPoints.length, 0);

  return (
    <section className="summary" aria-live="polite">
      <h2 className="summary__title">Entretien terminé</h2>
      {graded.length > 0 && (
        <p className="summary__lead">
          Points clés couverts : <strong>{covered}</strong> / {expected}
        </p>
      )}
      <ol className="interview-results">
        {results.map(({ card, grade }) => (
          <li key={card.id} className="interview-results__item">
            <span className="interview-results__question">{card.question}</span>
            <span className="tag">{grade === null ? 'auto-évaluée' : `${grade.coveredKeyPoints.length} / ${card.keyPoints.length}`}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="button button--primary summary__action" onClick={onRestart}>
        Nouvel entretien
      </button>
    </section>
  );
}
