import { describe, it, expect } from 'vitest';
import {
  getMethodColor,
  getScoreColor,
  getWorkspaceColor,
  SCORE_THRESHOLDS,
} from '@yasp/core/lib/constants';

describe('getMethodColor', () => {
  it('returns different values for different HTTP methods', () => {
    expect(getMethodColor('get')).not.toEqual(getMethodColor('post'));
    expect(getMethodColor('put')).not.toEqual(getMethodColor('delete'));
  });

  it('is case-insensitive', () => {
    expect(getMethodColor('GET')).toEqual(getMethodColor('get'));
    expect(getMethodColor('POST')).toEqual(getMethodColor('post'));
    expect(getMethodColor('DELETE')).toEqual(getMethodColor('delete'));
  });

  it('provides a fallback for unknown methods', () => {
    const result = getMethodColor('TRACE');
    expect(result.text).toBeTruthy();
    expect(result.bg).toBeTruthy();
    expect(result.border).toBeTruthy();
  });

  it('returns an object with bg, text, and border keys for all known methods', () => {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const method of methods) {
      const result = getMethodColor(method);
      expect(result).toHaveProperty('bg');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('border');
    }
  });
});

describe('getScoreColor', () => {
  it('returns distinct classes for excellent, good, and poor scores', () => {
    const excellent = getScoreColor(SCORE_THRESHOLDS.excellent + 5); // 85
    const good = getScoreColor(SCORE_THRESHOLDS.good + 5);           // 65
    const poor = getScoreColor(SCORE_THRESHOLDS.good - 10);          // 50

    const tiers = new Set([excellent, good, poor]);
    expect(tiers.size).toBe(3);
  });

  it('returns a non-empty string for any score', () => {
    expect(getScoreColor(100)).toBeTruthy();
    expect(getScoreColor(50)).toBeTruthy();
    expect(getScoreColor(0)).toBeTruthy();
  });

  it('excellent threshold score returns excellent color', () => {
    const atThreshold = getScoreColor(SCORE_THRESHOLDS.excellent);
    const above = getScoreColor(100);
    expect(atThreshold).toBe(above); // same tier
  });

  it('good threshold score returns good color', () => {
    const atThreshold = getScoreColor(SCORE_THRESHOLDS.good);
    const above = getScoreColor(SCORE_THRESHOLDS.good + 5);
    expect(atThreshold).toBe(above); // same tier
  });
});

describe('getWorkspaceColor', () => {
  it('returns a non-empty string for all known workspace types', () => {
    const knownTypes = ['partner', 'public', 'personal'];
    for (const type of knownTypes) {
      expect(getWorkspaceColor(type)).toBeTruthy();
    }
  });

  it('falls back to personal for unknown type', () => {
    expect(getWorkspaceColor('unknown')).toBe(getWorkspaceColor('personal'));
    expect(getWorkspaceColor('')).toBe(getWorkspaceColor('personal'));
  });

  it('returns distinct values for partner and personal', () => {
    expect(getWorkspaceColor('partner')).not.toBe(getWorkspaceColor('personal'));
  });
});
