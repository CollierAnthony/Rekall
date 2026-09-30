export type RawRecord = Readonly<Record<string, unknown>>;

/**
 * Lit des champs dans un objet JSON brut en accumulant les problèmes rencontrés.
 * Un champ invalide est signalé dans `issues` et remplacé par une valeur neutre :
 * le résultat n'est exploitable que si `issues` est resté vide.
 */
export class FieldReader {
  readonly #issues: string[] = [];

  get issues(): readonly string[] {
    return this.#issues;
  }

  report(path: string, problem: string): void {
    this.#issues.push(`${path} : ${problem}`);
  }

  record(value: unknown, path: string): RawRecord {
    if (isRawRecord(value)) return value;
    this.report(path, 'objet attendu');
    return {};
  }

  list(fields: RawRecord, key: string, path: string): readonly unknown[] {
    const value = fields[key];
    if (Array.isArray(value)) return value;
    this.report(`${path}.${key}`, 'tableau attendu');
    return [];
  }

  text(fields: RawRecord, key: string, path: string): string {
    const value = fields[key];
    if (isNonEmptyText(value)) return value;
    this.report(`${path}.${key}`, 'texte non vide attendu');
    return '';
  }

  optionalText(fields: RawRecord, key: string, path: string): string | undefined {
    const value = fields[key];
    if (value === undefined || isNonEmptyText(value)) return value;
    this.report(`${path}.${key}`, 'texte non vide attendu, ou champ absent');
    return undefined;
  }

  textList(fields: RawRecord, key: string, path: string): readonly string[] {
    const value = fields[key];
    if (Array.isArray(value) && value.length > 0 && value.every(isNonEmptyText)) return value;
    this.report(`${path}.${key}`, 'liste non vide de textes non vides attendue');
    return [];
  }

  optionalTextList(fields: RawRecord, key: string, path: string): readonly string[] | undefined {
    return fields[key] === undefined ? undefined : this.textList(fields, key, path);
  }

  httpsUrl(fields: RawRecord, key: string, path: string): string {
    const value = fields[key];
    if (typeof value === 'string' && value.startsWith('https://')) return value;
    this.report(`${path}.${key}`, 'URL https attendue');
    return '';
  }

  oneOf<T extends string | number>(fields: RawRecord, key: string, path: string, allowed: readonly [T, ...T[]]): T {
    const value = fields[key];
    const match = allowed.find((candidate) => candidate === value);
    if (match !== undefined) return match;
    this.report(`${path}.${key}`, `une valeur parmi ${allowed.map((candidate) => JSON.stringify(candidate)).join(', ')} attendue`);
    return allowed[0];
  }
}

function isRawRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
