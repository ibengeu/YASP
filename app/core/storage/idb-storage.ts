/**
 * IndexedDB Storage Service
 * Provides CRUD operations and transaction management for local-first persistence
 *
 * Security: OWASP A03:2025 - Injection prevention via parameterized queries
 * Architecture: SRS_01 § 6.1 - Storage Service Layer
 */

import type {
  OpenApiDocument,
  StorageSchema,
  SecretEntry,
  SettingEntry,
} from './storage-schema';

const DB_NAME = 'yasp_db_v1';
const DB_VERSION = 1;

export class IDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize database connection with schema
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error?.message}`);
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create specs store
        if (!db.objectStoreNames.contains('specs')) {
          const specsStore = db.createObjectStore('specs', {
            keyPath: 'id',
            autoIncrement: false, // Use UUID
          });
          // Index for search performance
          specsStore.createIndex('title', 'title', { unique: false });
          specsStore.createIndex('created_at', 'created_at', { unique: false });
          specsStore.createIndex('workspaceType', 'metadata.workspaceType', {
            unique: false,
          });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Create secrets store (encrypted API keys)
        if (!db.objectStoreNames.contains('secrets')) {
          db.createObjectStore('secrets', { keyPath: 'key_id' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * === Specs Store Operations ===
   */

  async createSpec(spec: Omit<OpenApiDocument, 'id' | 'created_at' | 'updated_at'>): Promise<OpenApiDocument> {
    const db = await this.init();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const document: OpenApiDocument = {
      ...spec,
      id,
      created_at: now,
      updated_at: now,
      metadata: {
        score: 0,
        tags: [],
        workspaceType: 'personal',
        syncStatus: 'offline',
        isDiscoverable: false,
        ...spec.metadata,
      },
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['specs'], 'readwrite');
      const store = tx.objectStore('specs');
      const request = store.add(document);

      request.onsuccess = () => resolve(document);
      request.onerror = () => reject(new Error(`Failed to create spec: ${request.error?.message}`));
    });
  }

  async getSpec(id: string): Promise<OpenApiDocument | null> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['specs'], 'readonly');
      const store = tx.objectStore('specs');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get spec: ${request.error?.message}`));
    });
  }

  async getAllSpecs(): Promise<OpenApiDocument[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['specs'], 'readonly');
      const store = tx.objectStore('specs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get all specs: ${request.error?.message}`));
    });
  }

  async updateSpec(id: string, updates: Partial<Omit<OpenApiDocument, 'id' | 'created_at'>>): Promise<OpenApiDocument> {
    const db = await this.init();
    const existing = await this.getSpec(id);

    if (!existing) {
      throw new Error(`Spec with id ${id} not found`);
    }

    const updated: OpenApiDocument = {
      ...existing,
      ...updates,
      id, // Preserve ID
      created_at: existing.created_at, // Preserve creation time
      updated_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['specs'], 'readwrite');
      const store = tx.objectStore('specs');
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(new Error(`Failed to update spec: ${request.error?.message}`));
    });
  }

  async deleteSpec(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['specs'], 'readwrite');
      const store = tx.objectStore('specs');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete spec: ${request.error?.message}`));
    });
  }

  /**
   * Search specs by title (uses index)
   */
  async searchSpecsByTitle(query: string): Promise<OpenApiDocument[]> {
    const allSpecs = await this.getAllSpecs();
    const lowerQuery = query.toLowerCase();

    return allSpecs.filter((spec) =>
      spec.title.toLowerCase().includes(lowerQuery) ||
      spec.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * === Settings Store Operations ===
   */

  async getSetting<T = any>(key: string): Promise<T | null> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['settings'], 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as SettingEntry | undefined;
        resolve(entry ? entry.value : null);
      };
      request.onerror = () => reject(new Error(`Failed to get setting: ${request.error?.message}`));
    });
  }

  async setSetting<T = any>(key: string, value: T): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['settings'], 'readwrite');
      const store = tx.objectStore('settings');
      const entry: SettingEntry = { key, value };
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to set setting: ${request.error?.message}`));
    });
  }

  /**
   * === Secrets Store Operations ===
   * Note: Values are encrypted before storage (see core/security/crypto.ts)
   */

  async createSecret(secret: Omit<SecretEntry, 'key_id' | 'created_at'>): Promise<SecretEntry> {
    const db = await this.init();
    const key_id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    const entry: SecretEntry = {
      ...secret,
      key_id,
      created_at,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['secrets'], 'readwrite');
      const store = tx.objectStore('secrets');
      const request = store.add(entry);

      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(new Error(`Failed to create secret: ${request.error?.message}`));
    });
  }

  async getAllSecrets(): Promise<SecretEntry[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['secrets'], 'readonly');
      const store = tx.objectStore('secrets');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get secrets: ${request.error?.message}`));
    });
  }

  async deleteSecret(key_id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['secrets'], 'readwrite');
      const store = tx.objectStore('secrets');
      const request = store.delete(key_id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete secret: ${request.error?.message}`));
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
export const idbStorage = new IDBStorage();
