import { describe, expect, test } from 'vitest';
import { sortEvents } from './EventsTable.utils';

describe('sortEvents', () => {
  test('returns a new array without mutating the original', () => {
    const events = [{ lastTimestamp: '2024-01-01T00:00:00Z' }];
    expect(sortEvents(events)).not.toBe(events);
  });

  test('sorts by lastTimestamp descending (newest first)', () => {
    const events = [
      { lastTimestamp: '2024-01-01T00:00:00Z' },
      { lastTimestamp: '2024-01-03T00:00:00Z' },
      { lastTimestamp: '2024-01-02T00:00:00Z' },
    ];
    const result = sortEvents(events);
    expect(result.map(e => e.lastTimestamp)).toEqual([
      '2024-01-03T00:00:00Z',
      '2024-01-02T00:00:00Z',
      '2024-01-01T00:00:00Z',
    ]);
  });

  test('falls back to eventTime when lastTimestamp is absent', () => {
    const events = [
      { eventTime: '2024-01-01T00:00:00Z' },
      { eventTime: '2024-01-03T00:00:00Z' },
    ];
    const result = sortEvents(events);
    expect(result[0].eventTime).toBe('2024-01-03T00:00:00Z');
  });

  test('lastTimestamp takes priority over eventTime', () => {
    const events = [
      { lastTimestamp: '2024-01-01T00:00:00Z', eventTime: '2024-01-05T00:00:00Z' },
      { lastTimestamp: '2024-01-03T00:00:00Z', eventTime: '2024-01-02T00:00:00Z' },
    ];
    const result = sortEvents(events);
    expect(result[0].lastTimestamp).toBe('2024-01-03T00:00:00Z');
  });

  test('treats missing timestamps as empty string (sorts last)', () => {
    const events = [
      { lastTimestamp: '2024-01-02T00:00:00Z' },
      {},
      { lastTimestamp: '2024-01-01T00:00:00Z' },
    ];
    const result = sortEvents(events);
    expect(result[0].lastTimestamp).toBe('2024-01-02T00:00:00Z');
    expect(result[2].lastTimestamp).toBeUndefined();
  });

  test('returns empty array for empty input', () => {
    expect(sortEvents([])).toEqual([]);
  });
});
