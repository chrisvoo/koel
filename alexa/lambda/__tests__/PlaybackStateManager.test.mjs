import { jest, describe, it, expect } from '@jest/globals';

// Mock AWS SDK modules before importing PlaybackStateManager
jest.unstable_mockModule('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));
jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: jest.fn().mockReturnValue({}) },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
}));

const { default: PlaybackStateManager } = await import('../services/PlaybackStateManager.mjs');

describe('PlaybackStateManager', () => {
  describe('defaultState', () => {
    it('should return a default state with userId', () => {
      const manager = new PlaybackStateManager('user-123');
      const state = manager.defaultState();

      expect(state.userId).toBe('user-123');
      expect(state.queue).toEqual([]);
      expect(state.currentIndex).toBe(0);
      expect(state.offsetInMilliseconds).toBe(0);
      expect(state.shuffle).toBe(false);
      expect(state.loop).toBe(false);
    });
  });

  describe('buildQueue', () => {
    it('should build a queue from song data', () => {
      const songs = [
        {
          id: 'song-1',
          title: 'Painkiller',
          artist_name: 'Judas Priest',
          album_name: 'Painkiller',
          album_cover: 'https://example.com/cover.jpg',
          length: 370,
        },
        {
          id: 'song-2',
          title: 'Breaking the Law',
          artist_name: 'Judas Priest',
          album_name: 'British Steel',
          album_cover: null,
          length: 156,
        },
      ];

      const queue = PlaybackStateManager.buildQueue(songs, 'https://koel.test', 'audio-token');

      expect(queue).toHaveLength(2);
      expect(queue[0].id).toBe('song-1');
      expect(queue[0].title).toBe('Painkiller');
      expect(queue[0].artist).toBe('Judas Priest');
      expect(queue[0].url).toBe('https://koel.test/play/song-1?t=audio-token');
      expect(queue[0].token).toBe('song-1');
      expect(queue[1].albumCover).toBeNull();
    });
  });

  describe('shuffleArray', () => {
    it('should return an array of the same length', () => {
      const input = [1, 2, 3, 4, 5];
      const shuffled = PlaybackStateManager.shuffleArray(input);

      expect(shuffled).toHaveLength(5);
      expect(shuffled.sort()).toEqual(input.sort());
    });

    it('should not mutate the original array', () => {
      const input = [1, 2, 3, 4, 5];
      const copy = [...input];
      PlaybackStateManager.shuffleArray(input);

      expect(input).toEqual(copy);
    });
  });
});
