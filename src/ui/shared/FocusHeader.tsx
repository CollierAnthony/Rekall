import type { ReactNode } from 'react';
import { Icon } from './Icon';

type FocusHeaderProps = {
  readonly closeLabel: string;
  readonly onClose: () => void;
  /** Rang affiché, à partir de 1 : « 4 / 16 ». */
  readonly step: number;
  readonly total: number;
  /** Part déjà accomplie, de 0 à 1. */
  readonly progress: number;
  /** Préfixe du compteur, par exemple « Question ». */
  readonly stepLabel?: string;
  readonly tone?: 'review' | 'interview';
  /** Action à droite (signaler la carte). Sans action, un espace vide garde le compteur centré. */
  readonly action?: ReactNode;
};

/** En-tête des écrans en mode focus (session, entretien) : sortir, avancement, action. */
export function FocusHeader({ closeLabel, onClose, step, total, progress, stepLabel, tone = 'review', action }: FocusHeaderProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <header className={`focus-header focus-header--${tone}`}>
      <button type="button" className="round-button" aria-label={closeLabel} onClick={onClose}>
        <Icon name="close" strokeWidth={2.2} />
      </button>
      <div className="focus-header__progress">
        <p className="focus-header__step">
          {stepLabel !== undefined && `${stepLabel} `}
          {step} <span className="focus-header__total">/ {total}</span>
        </p>
        <div className="progress-bar" role="progressbar" aria-label="Avancement" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span className="progress-bar__fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {action ?? <span className="focus-header__spacer" aria-hidden="true" />}
    </header>
  );
}

type SimpleFocusHeaderProps = {
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly title: string;
};

/** En-tête de mode focus sans compteur (intro et bilan de l'entretien). */
export function SimpleFocusHeader({ closeLabel, onClose, title }: SimpleFocusHeaderProps) {
  return (
    <header className="focus-header">
      <button type="button" className="round-button" aria-label={closeLabel} onClick={onClose}>
        <Icon name="close" strokeWidth={2.2} />
      </button>
      <p className="focus-header__title">{title}</p>
    </header>
  );
}
