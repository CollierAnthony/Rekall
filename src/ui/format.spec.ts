import { describe, expect, it } from 'vitest';
import { formatInterval } from './format';

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
