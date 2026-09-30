export class InvalidDeckFileError extends Error {
  readonly fileName: string;
  readonly issues: readonly string[];

  constructor(fileName: string, issues: readonly string[]) {
    super(`${fileName} invalide :\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'InvalidDeckFileError';
    this.fileName = fileName;
    this.issues = issues;
  }
}
