/**
 * TDD Cycle 1: IDB Favorites operations
 * Tests written FIRST — implementation follows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IDBStorage } from '@yasp/core/core/storage/idb-storage';

describe('IDBStorage — Favorites', () => {
  let storage: IDBStorage;

  beforeEach(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('yasp_db_v1');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    storage = new IDBStorage();
    await storage.init();
  });

  afterEach(() => {
    storage.close();
  });

  describe('getFavoriteSpecIds', () => {
    it('should return empty array when no favorites exist', async () => {
      const result = await storage.getFavoriteSpecIds();
      expect(result).toEqual([]);
    });

    it('should return saved favorite spec ids', async () => {
      await storage.setSetting('favoriteSpecIds', ['spec-1', 'spec-2']);
      const result = await storage.getFavoriteSpecIds();
      expect(result).toEqual(['spec-1', 'spec-2']);
    });
  });

  describe('toggleFavoriteSpec', () => {
    it('should add a spec id when not already favorited', async () => {
      const result = await storage.toggleFavoriteSpec('spec-1');
      expect(result).toEqual(['spec-1']);

      const stored = await storage.getFavoriteSpecIds();
      expect(stored).toEqual(['spec-1']);
    });

    it('should remove a spec id when already favorited', async () => {
      await storage.toggleFavoriteSpec('spec-1');
      await storage.toggleFavoriteSpec('spec-2');

      const result = await storage.toggleFavoriteSpec('spec-1');
      expect(result).toEqual(['spec-2']);

      const stored = await storage.getFavoriteSpecIds();
      expect(stored).toEqual(['spec-2']);
    });

    it('should handle toggling on empty favorites', async () => {
      const result = await storage.toggleFavoriteSpec('first-spec');
      expect(result).toEqual(['first-spec']);
    });

    it('should not create duplicates when adding', async () => {
      await storage.setSetting('favoriteSpecIds', ['spec-1']);
      const result = await storage.toggleFavoriteSpec('spec-1');
      // Toggling an existing favorite removes it
      expect(result).toEqual([]);
    });
  });
});
