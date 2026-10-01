import { describe, expect, it } from 'vitest';
import { formatDueLabel, formatInterval, formatSourceHost } from './format';

const from = new Date('2026-10-01T08:00:00Z');
const after = (milliseconds: number): Date => new Date(from.getTime() + milliseconds);
const minute = 60_000;
const day = 1_440 * minute;

describe('formatInterval', () => {
  it.each([
    [30_000, '1 min'],
    [10 * minute, '10 min'],
    [5 * 60 * minute, '5 h'],
    [23.7 * 60 * minute, '1 j'],
    [8 * day, '8 j'],
    [45 * day, '2 mois'],
    [400 * day, '1 an'],
  ])('%d ms → %s', (milliseconds, expected) => {
    expect(formatInterval(from, after(milliseconds))).toBe(expected);
  });
});

describe('formatDueLabel', () => {
  // Dates locales : la journée de révision commence à 4 h, heure locale.
  const reviewedAt = new Date(2026, 9, 1, 23, 50);

  it('annonce « dans la session » pour une carte qui revient avant la fin de la journée de révision', () => {
    expect(formatDueLabel(reviewedAt, new Date(2026, 9, 1, 23, 51))).toBe('dans la session');
    expect(formatDueLabel(reviewedAt, new Date(2026, 9, 2, 0, 0))).toBe('dans la session');
  });

  it('annonce le délai pour une carte qui revient un autre jour', () => {
    expect(formatDueLabel(reviewedAt, new Date(2026, 9, 9, 23, 50))).toBe('dans 8 j');
  });
});

describe('formatSourceHost', () => {
  it('garde le domaine sans « www. »', () => {
    expect(formatSourceHost('https://developer.mozilla.org/en-US/docs/Web/JavaScript')).toBe('developer.mozilla.org');
    expect(formatSourceHost('https://www.typescriptlang.org/docs/')).toBe('typescriptlang.org');
  });
});
