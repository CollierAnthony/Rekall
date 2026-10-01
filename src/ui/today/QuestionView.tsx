import type { Card } from '../../domain/deck';
import { Icon } from '../shared/Icon';
import type { CardContext } from './card-contexts';
import { QuestionTile } from './QuestionTile';

type QuestionViewProps = {
  readonly card: Card;
  readonly context: CardContext;
  readonly onReveal: () => void;
};

/** La question seule, en grand ; le bouton pour révéler reste sous le pouce. */
export function QuestionView({ card, context, onReveal }: QuestionViewProps) {
  return (
    <div className="review review--question">
      <QuestionTile card={card} context={context} size="hero" />
      <div className="review__footer">
        <p className="hint">
          <Icon name="mic" size={18} />
          Réponds à voix haute, puis révèle.
        </p>
        <button type="button" className="button button--primary button--block" onClick={onReveal} aria-keyshortcuts="Space Enter">
          Afficher la réponse <kbd className="kbd">Espace</kbd>
        </button>
      </div>
    </div>
  );
}
