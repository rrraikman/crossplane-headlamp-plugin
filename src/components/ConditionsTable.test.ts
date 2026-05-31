import { describe, expect, test } from 'vitest';
import { reasonColor } from './ConditionsTable';

describe('reasonColor', () => {
  test('returns success for True', () => {
    expect(reasonColor('True')).toBe('success');
  });

  test('returns error for False', () => {
    expect(reasonColor('False')).toBe('error');
  });

  test('returns warning for Unknown', () => {
    expect(reasonColor('Unknown')).toBe('warning');
  });

  test('returns warning for any unrecognised value', () => {
    expect(reasonColor('')).toBe('warning');
    expect(reasonColor('Pending')).toBe('warning');
  });
});
