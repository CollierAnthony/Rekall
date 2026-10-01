import type { Card } from '../../domain/deck';
import { formatSourceHost } from '../format';
import { Icon } from '../shared/Icon';

/** Lien vers la page de doc dont la carte est tirée. */
export function SourceLink({ card }: { readonly card: Card }) {
  return (
    <a className="tile source-link" href={card.source.url} target="_blank" rel="noreferrer">
      <span className="source-link__text">
        <span className="source-link__label">Source · {formatSourceHost(card.source.url)}</span>
        <span className="source-link__title">{card.source.title}</span>
      </span>
      <Icon name="external" size={18} />
    </a>
  );
}
