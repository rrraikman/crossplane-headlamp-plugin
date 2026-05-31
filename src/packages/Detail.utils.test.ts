import { describe, expect, it } from 'vitest';
import { packageStatusLabel } from './Detail.utils';

describe('packageStatusLabel', () => {
  it('returns Healthy when both installed and healthy are True', () => {
    expect(packageStatusLabel('True', 'True')).toBe('Healthy');
  });

  it('returns Not Installed when installed is False', () => {
    expect(packageStatusLabel('False', 'True')).toBe('Not Installed');
  });

  it('returns Not Installed when installed is Unknown', () => {
    expect(packageStatusLabel('Unknown', 'True')).toBe('Not Installed');
  });

  it('returns Unhealthy when installed is True but healthy is not', () => {
    expect(packageStatusLabel('True', 'False')).toBe('Unhealthy');
  });

  it('returns Unhealthy when installed is True but healthy is Unknown', () => {
    expect(packageStatusLabel('True', 'Unknown')).toBe('Unhealthy');
  });

  it('returns Not Installed when both installed and healthy are not True', () => {
    expect(packageStatusLabel('False', 'False')).toBe('Not Installed');
  });
});
