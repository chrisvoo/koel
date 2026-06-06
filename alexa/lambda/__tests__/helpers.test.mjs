import { describe, it, expect } from '@jest/globals';
import { fuzzyMatch, findBestMatch } from '../services/matching.mjs';

describe('fuzzyMatch', () => {
  it('should match case-insensitively', () => {
    expect(fuzzyMatch('Judas Priest', 'judas priest')).toBe(true);
  });

  it('should match partial substrings', () => {
    expect(fuzzyMatch('Judas Priest', 'judas')).toBe(true);
  });

  it('should return false for non-matching strings', () => {
    expect(fuzzyMatch('Judas Priest', 'Iron Maiden')).toBe(false);
  });

  it('should handle null/undefined values', () => {
    expect(fuzzyMatch(null, 'test')).toBe(false);
    expect(fuzzyMatch('test', null)).toBe(false);
    expect(fuzzyMatch(null, null)).toBe(false);
  });
});

describe('findBestMatch', () => {
  const items = [
    { name: 'Heavy Metal' },
    { name: 'Death Metal' },
    { name: 'Rock' },
  ];

  it('should find an exact match', () => {
    expect(findBestMatch(items, 'Rock')).toEqual({ name: 'Rock' });
  });

  it('should find a case-insensitive exact match', () => {
    expect(findBestMatch(items, 'rock')).toEqual({ name: 'Rock' });
  });

  it('should find a substring match', () => {
    expect(findBestMatch(items, 'heavy')).toEqual({ name: 'Heavy Metal' });
  });

  it('should return null for no match', () => {
    expect(findBestMatch(items, 'Classical')).toBeNull();
  });

  it('should handle empty array', () => {
    expect(findBestMatch([], 'Rock')).toBeNull();
  });

  it('should handle null/undefined name', () => {
    expect(findBestMatch(items, null)).toBeNull();
  });

  it('should support custom name extractor', () => {
    const artists = [
      { title: 'Iron Maiden' },
      { title: 'Judas Priest' },
    ];
    expect(findBestMatch(artists, 'maiden', (a) => a.title)).toEqual({ title: 'Iron Maiden' });
  });
});
