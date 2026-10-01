type KeyPointChecklistProps = {
  readonly keyPoints: readonly string[];
  readonly idPrefix: string;
};

/** Points clés à cocher pour s'auto-évaluer. Cases non contrôlées : réinitialisées par la `key` du parent. */
export function KeyPointChecklist({ keyPoints, idPrefix }: KeyPointChecklistProps) {
  return (
    <ul className="checklist">
      {keyPoints.map((keyPoint, index) => (
        <li key={keyPoint}>
          <label className="checklist__item">
            <input type="checkbox" id={`${idPrefix}-${index}`} className="checklist__box" />
            <span>{keyPoint}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
