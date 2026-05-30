import { describe, expect, test } from 'vitest';
import { age, conditionStatus, getCondition, getReferenceableVersion, hasCondition, rawConditionStatus } from './utils';

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

// ── getCondition ──────────────────────────────────────────────────────────────

describe('getCondition', () => {
  test('returns the matching condition object', () => {
    const cond = { type: 'Ready', status: 'True', reason: 'Available' };
    expect(getCondition(makeResource([cond]), 'Ready')).toEqual(cond);
  });

  test('returns undefined when condition is missing', () => {
    expect(getCondition(makeResource([]), 'Ready')).toBeUndefined();
  });

  test('returns undefined when jsonData has no status', () => {
    expect(getCondition({ jsonData: {} }, 'Ready')).toBeUndefined();
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
