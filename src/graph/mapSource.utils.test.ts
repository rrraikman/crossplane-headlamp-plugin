import { nodeStatus } from './mapSource.utils';

describe('nodeStatus', () => {
  test('returns success when Ready and Synced are both True', () => {
    expect(nodeStatus([
      { type: 'Ready', status: 'True' },
      { type: 'Synced', status: 'True' },
    ])).toBe('success');
  });

  test('returns error when Synced is False', () => {
    expect(nodeStatus([
      { type: 'Ready', status: 'True' },
      { type: 'Synced', status: 'False' },
    ])).toBe('error');
  });

  test('returns error when Ready is False', () => {
    expect(nodeStatus([
      { type: 'Ready', status: 'False' },
      { type: 'Synced', status: 'True' },
    ])).toBe('error');
  });

  test('returns warning when Ready is Unknown', () => {
    expect(nodeStatus([
      { type: 'Ready', status: 'Unknown' },
      { type: 'Synced', status: 'True' },
    ])).toBe('warning');
  });

  test('returns warning when conditions are empty', () => {
    expect(nodeStatus([])).toBe('warning');
  });

  test('returns warning when Synced is Unknown', () => {
    expect(nodeStatus([
      { type: 'Ready', status: 'True' },
      { type: 'Synced', status: 'Unknown' },
    ])).toBe('warning');
  });
});
