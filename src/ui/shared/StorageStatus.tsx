import type { StorageMode } from '../../composition-root';

const LABELS: Readonly<Record<StorageMode, { readonly text: string; readonly title: string }>> = {
  synced: { text: 'Synchronisé', title: 'Ta progression est enregistrée en ligne et suit tes appareils.' },
  'this-device': {
    text: 'Sur cet appareil',
    title: 'Ta progression est enregistrée dans ce navigateur uniquement. Ouvre l’artefact publié pour la synchroniser.',
  },
};

export function StorageStatus({ mode }: { readonly mode: StorageMode }) {
  const label = LABELS[mode];
  return (
    <p className={`sync-pill sync-pill--${mode}`} title={label.title}>
      <span className="sync-pill__dot" aria-hidden="true" />
      {label.text}
    </p>
  );
}
