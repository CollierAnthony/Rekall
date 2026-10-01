import type { Card } from '../../domain/deck';
import { Icon } from '../shared/Icon';

/** Découpe « details » en paragraphes ; un bloc qui contient des retours à la ligne est du code. */
function detailBlocks(details: string): { readonly text: string; readonly isCode: boolean }[] {
  return details.split('\n\n').map((text) => ({ text, isCode: text.includes('\n') }));
}

/** La réponse modèle, à dire en 30 secondes. */
export function AnswerTile({ card }: { readonly card: Card }) {
  return (
    <section className="tile answer-tile" aria-label="Réponse">
      <p className="tile__eyebrow">Réponse</p>
      <p className="answer-tile__text">{card.answer}</p>
    </section>
  );
}

/** Les points clés en simple liste, quand il n'y a rien à cocher (bibliothèque). */
export function KeyPointList({ card }: { readonly card: Card }) {
  return (
    <section className="tile keypoints" aria-labelledby={`keypoints-${card.id}`}>
      <h3 id={`keypoints-${card.id}`} className="tile__title">
        Points clés
      </h3>
      <ul className="bullets">
        {card.keyPoints.map((keyPoint) => (
          <li key={keyPoint} className="bullets__item">
            {keyPoint}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PitfallsTile({ card }: { readonly card: Card }) {
  if (card.pitfalls === undefined) return null;
  return (
    <section className="tile tile--warning pitfalls" aria-labelledby={`pitfalls-${card.id}`}>
      <h3 id={`pitfalls-${card.id}`} className="tile__title">
        {card.pitfalls.length > 1 ? 'Pièges' : 'Piège'}
      </h3>
      <ul className="pitfalls__list">
        {card.pitfalls.map((pitfall) => (
          <li key={pitfall}>{pitfall}</li>
        ))}
      </ul>
    </section>
  );
}

/** « Pour creuser », replié par défaut. */
export function DetailsTile({ card }: { readonly card: Card }) {
  if (card.details === undefined) return null;
  return (
    <details className="tile details">
      <summary className="details__summary">
        Pour creuser
        <Icon name="chevronDown" />
      </summary>
      <div className="details__body">
        {detailBlocks(card.details).map((block) =>
          block.isCode ? (
            <pre key={block.text} className="code">
              <code>{block.text}</code>
            </pre>
          ) : (
            <p key={block.text}>{block.text}</p>
          ),
        )}
      </div>
    </details>
  );
}
