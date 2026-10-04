import { describe, expect, test } from 'vitest';
import {
  age,
  conditionStatus,
  debugMessage,
  failingCondition,
  getReferenceableVersion,
  hasCondition,
  isHealthy,
  rawConditionStatus,
  readySyncedStatusLabel,
  sortFailingFirst,
} from './utils';

function makeResource(conditions: Array<{ type: string; status: string }>) {
  return { jsonData: { status: { conditions } } };
}

// ── age ───────────────────────────────────────────────────────────────────────

describe('age', () => {
  test('returns minutes for timestamps less than an hour ago', () => {
    const ts = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    expect(age(ts)).toBe('25m');
  });

  test('returns hours for timestamps less than a day ago', () => {
    const ts = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(age(ts)).toBe('3h');
  });

  test('returns days for timestamps more than a day ago', () => {
    const ts = new Date(Date.now() - 5 * 86400 * 1000).toISOString();
    expect(age(ts)).toBe('5d');
  });

  test('days takes priority over hours', () => {
    const ts = new Date(Date.now() - 2 * 86400 * 1000 - 3 * 3600 * 1000).toISOString();
    expect(age(ts)).toBe('2d');
  });
});

// ── hasCondition ──────────────────────────────────────────────────────────────

describe('hasCondition', () => {
  test('returns true when condition exists and status is True', () => {
    expect(hasCondition(makeResource([{ type: 'Ready', status: 'True' }]), 'Ready')).toBe(true);
  });

  test('returns false when condition status is False', () => {
    expect(hasCondition(makeResource([{ type: 'Ready', status: 'False' }]), 'Ready')).toBe(false);
  });

  test('returns false when condition status is Unknown', () => {
    expect(hasCondition(makeResource([{ type: 'Ready', status: 'Unknown' }]), 'Ready')).toBe(false);
  });

  test('returns false when condition is missing', () => {
    expect(hasCondition(makeResource([]), 'Ready')).toBe(false);
  });

  test('returns false when jsonData has no status', () => {
    expect(hasCondition({ jsonData: {} }, 'Ready')).toBe(false);
  });

  test('returns false when jsonData is missing', () => {
    expect(hasCondition({}, 'Ready')).toBe(false);
  });
});

// ── conditionStatus ───────────────────────────────────────────────────────────

describe('conditionStatus', () => {
  test('returns True when condition status is True', () => {
    expect(conditionStatus(makeResource([{ type: 'Synced', status: 'True' }]), 'Synced')).toBe('True');
  });

  test('returns False when condition status is False', () => {
    expect(conditionStatus(makeResource([{ type: 'Synced', status: 'False' }]), 'Synced')).toBe('False');
  });

  test('returns Unknown when condition is missing', () => {
    expect(conditionStatus(makeResource([]), 'Synced')).toBe('Unknown');
  });

  test('returns Unknown when jsonData has no status', () => {
    expect(conditionStatus({ jsonData: {} }, 'Synced')).toBe('Unknown');
  });
});

// ── rawConditionStatus ────────────────────────────────────────────────────────

describe('rawConditionStatus', () => {
  test('returns True when condition status is True', () => {
    expect(rawConditionStatus([{ type: 'Ready', status: 'True' }], 'Ready')).toBe('True');
  });

  test('returns False when condition status is False', () => {
    expect(rawConditionStatus([{ type: 'Ready', status: 'False' }], 'Ready')).toBe('False');
  });

  test('returns Unknown when condition is missing', () => {
    expect(rawConditionStatus([], 'Ready')).toBe('Unknown');
  });

  test('returns Unknown when conditions is null/undefined', () => {
    expect(rawConditionStatus(null as any, 'Ready')).toBe('Unknown');
  });
});

// ── readySyncedStatusLabel ────────────────────────────────────────────────────

describe('readySyncedStatusLabel', () => {
  test('returns Ready when both ready and synced are True', () => {
    expect(readySyncedStatusLabel('True', 'True')).toBe('Ready');
  });

  test('returns Sync Failed when synced is not True', () => {
    expect(readySyncedStatusLabel('True', 'False')).toBe('Sync Failed');
    expect(readySyncedStatusLabel('True', 'Unknown')).toBe('Sync Failed');
  });

  test('returns Not Ready when synced is True but ready is not', () => {
    expect(readySyncedStatusLabel('False', 'True')).toBe('Not Ready');
    expect(readySyncedStatusLabel('Unknown', 'True')).toBe('Not Ready');
  });

  test('Sync Failed takes priority over Not Ready when both are false', () => {
    expect(readySyncedStatusLabel('False', 'False')).toBe('Sync Failed');
  });
});

// ── getReferenceableVersion ───────────────────────────────────────────────────

describe('getReferenceableVersion', () => {
  test('returns the version marked as referenceable', () => {
    const spec = {
      versions: [
        { name: 'v1alpha1', referenceable: false },
        { name: 'v1', referenceable: true },
      ],
    };
    expect(getReferenceableVersion(spec)).toBe('v1');
  });

  test('falls back to the first version when none is marked referenceable', () => {
    const spec = {
      versions: [
        { name: 'v1beta1', referenceable: false },
        { name: 'v1alpha1', referenceable: false },
      ],
    };
    expect(getReferenceableVersion(spec)).toBe('v1beta1');
  });

  test('falls back to v1 when versions array is empty', () => {
    expect(getReferenceableVersion({ versions: [] })).toBe('v1');
  });

  test('falls back to v1 when spec is undefined', () => {
    expect(getReferenceableVersion(undefined)).toBe('v1');
  });

  test('falls back to v1 when versions is missing', () => {
    expect(getReferenceableVersion({})).toBe('v1');
  });
});

// ── isHealthy ────────────────────────────────────────────────────────────────

describe('isHealthy', () => {
  test('requires both Ready and Synced to be True', () => {
    expect(isHealthy([{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'True' }])).toBe(true);
    expect(isHealthy([{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'False' }])).toBe(false);
  });

  test('treats a missing condition as unhealthy', () => {
    expect(isHealthy([{ type: 'Ready', status: 'True' }])).toBe(false);
    expect(isHealthy(undefined)).toBe(false);
  });
});

// ── failingCondition ─────────────────────────────────────────────────────────

describe('failingCondition', () => {
  test('prefers a failing Synced condition over a failing Ready one', () => {
    const synced = { type: 'Synced', status: 'False' };
    expect(failingCondition([{ type: 'Ready', status: 'False' }, synced])).toBe(synced);
  });

  test('returns a failing Ready condition when Synced is absent', () => {
    const ready = { type: 'Ready', status: 'False', reason: 'Creating' };
    expect(failingCondition([ready])).toBe(ready);
  });

  test('returns undefined when nothing reported is failing', () => {
    expect(failingCondition([{ type: 'Ready', status: 'True' }])).toBeUndefined();
    expect(failingCondition(undefined)).toBeUndefined();
  });
});

// ── debugMessage ─────────────────────────────────────────────────────────────

describe('debugMessage', () => {
  test('returns the Synced message ahead of the Ready message', () => {
    const conditions = [
      { type: 'Ready', status: 'False', message: 'ready error' },
      { type: 'Synced', status: 'False', message: 'sync error' },
    ];
    expect(debugMessage(conditions)).toBe('sync error');
  });

  test('returns the Ready message when Synced is True', () => {
    const conditions = [
      { type: 'Synced', status: 'True', message: '' },
      { type: 'Ready', status: 'False', message: 'resource not found' },
    ];
    expect(debugMessage(conditions)).toBe('resource not found');
  });

  test('falls through to Ready when the failing Synced condition has no message', () => {
    const conditions = [
      { type: 'Synced', status: 'False', message: '' },
      { type: 'Ready', status: 'False', message: 'still creating' },
    ];
    expect(debugMessage(conditions)).toBe('still creating');
  });

  test('returns null when all conditions are True, empty or missing', () => {
    expect(debugMessage([{ type: 'Synced', status: 'True', message: 'ok' }])).toBeNull();
    expect(debugMessage([])).toBeNull();
    expect(debugMessage(undefined)).toBeNull();
  });
});

// ── sortFailingFirst ─────────────────────────────────────────────────────────

describe('sortFailingFirst', () => {
  test('puts failing items first and applies the tiebreak within each group', () => {
    const items = [
      { name: 'b', ok: true },
      { name: 'z', ok: false },
      { name: 'a', ok: true },
      { name: 'y', ok: false },
    ];
    const sorted = sortFailingFirst(items, i => i.ok, (x, y) => x.name.localeCompare(y.name));
    expect(sorted.map(i => i.name)).toEqual(['y', 'z', 'a', 'b']);
  });

  test('keeps the original order without a tiebreak and does not mutate input', () => {
    const items = [{ n: 1, ok: true }, { n: 2, ok: false }, { n: 3, ok: false }];
    expect(sortFailingFirst(items, i => i.ok).map(i => i.n)).toEqual([2, 3, 1]);
    expect(items.map(i => i.n)).toEqual([1, 2, 3]);
  });
});
