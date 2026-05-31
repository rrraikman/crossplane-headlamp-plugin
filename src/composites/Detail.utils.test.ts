import { describe, expect, test } from 'vitest';
import { compositeStatusLabel } from './Detail.utils';

describe('compositeStatusLabel', () => {
  test('returns Ready when both ready and synced are True', () => {
    expect(compositeStatusLabel('True', 'True')).toBe('Ready');
  });

  test('returns Sync Failed when synced is not True', () => {
    expect(compositeStatusLabel('True', 'False')).toBe('Sync Failed');
    expect(compositeStatusLabel('True', 'Unknown')).toBe('Sync Failed');
  });

  test('returns Not Ready when synced is True but ready is not', () => {
    expect(compositeStatusLabel('False', 'True')).toBe('Not Ready');
    expect(compositeStatusLabel('Unknown', 'True')).toBe('Not Ready');
  });

  test('Sync Failed takes priority when both are not True', () => {
    expect(compositeStatusLabel('False', 'False')).toBe('Sync Failed');
  });
});
