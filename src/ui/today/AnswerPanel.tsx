import type { Card } from '../../domain/deck';
import { KeyPointChecklist } from './KeyPointChecklist';

/** Découpe « details » en paragraphes ; un bloc qui contient des retours à la ligne est du code. */
function detailBlocks(details: string): { readonly text: string; readonly isCode: boolean }[] {
  return details.split('\n\n').map((text) => ({ text, isCode: text.includes('\n') }));
}

export function AnswerPanel({ card }: { readonly card: Card }) {
  return (
    <section className="answer" aria-label="Réponse">
      <p className="answer__text">{card.answer}</p>

      <h3 className="answer__heading">Points clés</h3>
      <p className="answer__note">Coche ce que tu as dit : c’est ta grille pour te noter.</p>
      <KeyPointChecklist keyPoints={card.keyPoints} idPrefix="key-point" />

      {card.pitfalls !== undefined && (
        <>
          <h3 className="answer__heading">Pièges</h3>
          <ul className="pitfalls">
            {card.pitfalls.map((pitfall) => (
              <li key={pitfall}>{pitfall}</li>
            ))}
          </ul>
        </>
      )}

      {card.details !== undefined && (
        <details className="answer__details">
          <summary>Pour creuser</summary>
          {detailBlocks(card.details).map((block) =>
            block.isCode ? (
              <pre key={block.text} className="code">
                <code>{block.text}</code>
              </pre>
            ) : (
              <p key={block.text}>{block.text}</p>
            ),
          )}
        </details>
      )}

      <p className="answer__source">
        Source :{' '}
        <a href={card.source.url} target="_blank" rel="noreferrer">
          {card.source.title}
        </a>
      </p>
    </section>
  );
}
