import { useState } from 'react';

type KeyPointChecklistProps = {
  readonly keyPoints: readonly string[];
  /** Préfixe unique des identifiants (titre de la tuile). */
  readonly idPrefix: string;
};

/**
 * Points clés à cocher pour s'auto-évaluer, avec le compte de ceux qu'on a dits.
 * L'état vit ici : le parent remonte le composant (`key`) à chaque nouvelle carte.
 */
export function KeyPointChecklist({ keyPoints, idPrefix }: KeyPointChecklistProps) {
  const [checkedIndexes, setCheckedIndexes] = useState<ReadonlySet<number>>(() => new Set());
  const titleId = `${idPrefix}-title`;

  function toggle(index: number): void {
    setCheckedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <section className="tile keypoints" aria-labelledby={titleId}>
      <div className="tile__header">
        <h3 id={titleId} className="tile__title">
          Points clés
        </h3>
        <span className="count-pill" aria-hidden="true">
          {checkedIndexes.size} / {keyPoints.length}
        </span>
      </div>
      <p className="tile__note">Coche ce que tu as dit : c’est ta grille pour te noter.</p>
      <ul className="checklist">
        {keyPoints.map((keyPoint, index) => (
          <li key={keyPoint}>
            <label className="checklist__item">
              <input type="checkbox" className="checklist__box" checked={checkedIndexes.has(index)} onChange={() => toggle(index)} />
              <span>{keyPoint}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
