type StatTileProps = {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
};

/** Tuile chiffrée : « Demain · 9 cartes à revoir ». */
export function StatTile({ label, value, unit }: StatTileProps) {
  return (
    <div className="tile stat-tile">
      <p className="stat-tile__label">{label}</p>
      <p className="stat-tile__figure">
        <span className="stat-tile__value">{value}</span>
        <span className="stat-tile__unit">{unit}</span>
      </p>
    </div>
  );
}
