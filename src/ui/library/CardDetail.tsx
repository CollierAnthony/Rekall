import { useEffect, useEffectEvent, useState } from 'react';
import type { CardReport } from '../../domain/card-report';
import { cardStatus } from '../../domain/card-status';
import type { Card } from '../../domain/deck';
import type { CardProgress } from '../../domain/review';
import { formatInterval, plural } from '../format';
import { DIFFICULTY_LABELS } from '../shared/card-labels';
import { Icon } from '../shared/Icon';
import type { CardContext } from '../today/card-contexts';
import { AnswerTile, DetailsTile, KeyPointList, PitfallsTile } from '../today/CardSections';
import { QuestionTile } from '../today/QuestionTile';
import { ReportSheet } from '../today/ReportSheet';
import { SourceLink } from '../today/SourceLink';

type CardDetailProps = {
  readonly card: Card;
  readonly context: CardContext;
  readonly progress: CardProgress | undefined;
  readonly now: Date;
  readonly onBack: () => void;
  readonly onReport: (report: CardReport) => Promise<void>;
};

/** Fiche d'une carte depuis la bibliothèque : tout son contenu, et où elle en est. Rien à noter ici. */
export function CardDetail({ card, context, progress, now, onBack, onReport }: CardDetailProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const status = cardStatus(progress, now);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || isReportOpen || event.defaultPrevented) return;
    event.preventDefault();
    onBack();
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const nextReview = status.kind === 'new' ? 'À découvrir' : status.kind === 'due' ? 'Aujourd’hui' : `Dans ${formatInterval(now, status.dueAt)}`;

  return (
    <div className="focus">
      <header className="focus-header">
        <button type="button" className="round-button" aria-label="Retour à la bibliothèque" onClick={onBack}>
          <Icon name="back" strokeWidth={2.2} />
        </button>
        <p className="focus-header__title focus-header__title--grow">Bibliothèque</p>
        <button type="button" className="round-button round-button--quiet" aria-label="Signaler la carte" onClick={() => setIsReportOpen(true)}>
          <Icon name="flag" size={19} />
        </button>
      </header>
      <main className="focus__main">
        <div className="review review--detail">
          <QuestionTile card={card} context={context} size="hero" />
          <dl className="tile facts">
            <div>
              <dt className="facts__label">Révisée</dt>
              <dd className="facts__value">{progress === undefined ? 'Jamais' : plural(progress.reviewCount, 'fois', 'fois')}</dd>
            </div>
            <div>
              <dt className="facts__label">Prochaine</dt>
              <dd className="facts__value">{nextReview}</dd>
            </div>
            <div>
              <dt className="facts__label">Niveau</dt>
              <dd className="facts__value">{DIFFICULTY_LABELS[card.difficulty]}</dd>
            </div>
          </dl>
          <AnswerTile card={card} />
          <KeyPointList card={card} />
          <PitfallsTile card={card} />
          <DetailsTile card={card} />
          <SourceLink card={card} />
          <button type="button" className="link-button report-link" onClick={() => setIsReportOpen(true)}>
            <Icon name="flag" size={16} />
            Signaler cette carte
          </button>
        </div>
      </main>
      <ReportSheet cardId={card.id} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onSubmit={onReport} />
    </div>
  );
}
