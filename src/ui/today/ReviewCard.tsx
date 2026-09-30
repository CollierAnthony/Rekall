import type { CardReport } from '../../domain/card-report';
import type { Card, CardKind } from '../../domain/deck';
import type { Rating } from '../../domain/review';
import { AnswerPanel } from './AnswerPanel';
import { RatingBar } from './RatingBar';
import { ReportCardForm } from './ReportCardForm';
import type { SaveStatus } from './useTodaySession';

export type CardContext = {
  readonly deckTitle: string;
  readonly moduleTitle: string;
};

type ReviewCardProps = {
  readonly card: Card;
  readonly context: CardContext;
  readonly revealedAt: Date | null;
  readonly dueDates: Readonly<Record<Rating, Date>> | null;
  readonly saveStatus: SaveStatus;
  readonly onReveal: () => void;
  readonly onRate: (rating: Rating) => void;
  readonly onReport: (report: CardReport) => Promise<void>;
};

const KIND_LABELS: Readonly<Record<CardKind, string>> = {
  recall: 'Rappel',
  compare: 'Comparaison',
  code: 'Lecture de code',
};

const DIFFICULTY_LABELS = { 1: 'Facile', 2: 'Intermédiaire', 3: 'Avancé' } as const;

export function ReviewCard({ card, context, revealedAt, dueDates, saveStatus, onReveal, onRate, onReport }: ReviewCardProps) {
  return (
    <article className="flashcard" aria-labelledby={`question-${card.id}`}>
      <div className="flashcard__meta">
        <span className="flashcard__module">
          {context.deckTitle} · {context.moduleTitle}
        </span>
        <span className="flashcard__tags">
          <span className="tag">{KIND_LABELS[card.kind]}</span>
          <span className="tag" title={`Difficulté ${card.difficulty} sur 3`}>
            <span className="difficulty" aria-hidden="true">
              {[1, 2, 3].map((level) => (
                <span key={level} className={level <= card.difficulty ? 'difficulty__dot difficulty__dot--on' : 'difficulty__dot'} />
              ))}
            </span>
            {DIFFICULTY_LABELS[card.difficulty]}
          </span>
          {card.since !== undefined && <span className="tag tag--since">{card.since}</span>}
        </span>
      </div>

      <h2 id={`question-${card.id}`} className="flashcard__question">
        {card.question}
      </h2>
      {card.code !== undefined && (
        <pre className="code">
          <code>{card.code}</code>
        </pre>
      )}

      {revealedAt === null || dueDates === null ? (
        <div className="flashcard__prompt">
          <p className="flashcard__hint">Réponds à voix haute, comme en entretien, puis affiche la réponse.</p>
          <button type="button" className="button button--primary" onClick={onReveal} aria-keyshortcuts="Space">
            Afficher la réponse <kbd>Espace</kbd>
          </button>
        </div>
      ) : (
        <>
          <AnswerPanel card={card} />
          <RatingBar revealedAt={revealedAt} dueDates={dueDates} isSaving={saveStatus === 'saving'} onRate={onRate} />
          {saveStatus === 'failed' && (
            <p className="flashcard__error" role="alert">
              La note n’a pas été enregistrée. Vérifie ta connexion, puis note à nouveau.
            </p>
          )}
        </>
      )}

      <footer className="flashcard__footer">
        <ReportCardForm cardId={card.id} onSubmit={onReport} />
      </footer>
    </article>
  );
}
