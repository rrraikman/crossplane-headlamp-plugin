import { describe, expect, test } from 'vitest';
import { packageStatusLabel } from './Detail.utils';

describe('packageStatusLabel', () => {
  test('returns Healthy when both installed and healthy are True', () => {
    expect(packageStatusLabel('True', 'True')).toBe('Healthy');
  });

  test('returns Not Installed when installed is False', () => {
    expect(packageStatusLabel('False', 'True')).toBe('Not Installed');
  });

  test('returns Not Installed when installed is Unknown', () => {
    expect(packageStatusLabel('Unknown', 'True')).toBe('Not Installed');
  });

  test('returns Unhealthy when installed is True but healthy is not', () => {
    expect(packageStatusLabel('True', 'False')).toBe('Unhealthy');
  });

  test('returns Unhealthy when installed is True but healthy is Unknown', () => {
    expect(packageStatusLabel('True', 'Unknown')).toBe('Unhealthy');
  });

  test('Not Installed takes priority when both are not True', () => {
    expect(packageStatusLabel('False', 'False')).toBe('Not Installed');
  });
});
