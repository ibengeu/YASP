import { OpenApiDocument } from "@/common/openapi-spec";

interface StoredSpec {
    id?: number;
    title: string;
    version: string;
    description?: string;
    spec: OpenApiDocument;
    createdAt: string;
    workspaceType?: 'Personal' | 'Team' | 'Partner' | 'Public';
    syncStatus?: 'synced' | 'syncing' | 'offline';
    tags?: string[];
    isDiscoverable?: boolean;
}

export class IndexedDBService {
    private dbName = 'apiSpecsDB';
    private version = 1;
    private storeName = 'specs';

    async initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {keyPath: 'id', autoIncrement: true});
                }
            };
        });
    }

    async getSpecById(id: number): Promise<StoredSpec | null> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSpec(id: string | number): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async checkSpecExists(title: string, version: string): Promise<boolean> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const specs = request.result as StoredSpec[];
                const exists = specs.some(
                    spec => spec.title === title && spec.version === version
                );
                resolve(exists);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveSpec(spec: OpenApiDocument): Promise<number> {
        const exists = await this.checkSpecExists(spec.info.title, spec.info.version);

        if (exists) {
            throw new Error('A specification with this title and version already exists');
        }

        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const storedSpec: StoredSpec = {
                title: spec.info.title,
                version: spec.info.version,
                description: spec.info.description,
                spec: spec,
                createdAt: new Date().toISOString(),
                workspaceType: 'Personal',
                syncStatus: 'synced',
                tags: [],
                isDiscoverable: false
            };

            const request = store.add(storedSpec);

            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSpecs(): Promise<StoredSpec[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateSpec(id: string | number, updates: Partial<StoredSpec>): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const existingSpec = getRequest.result;
                if (!existingSpec) {
                    reject(new Error('Spec not found'));
                    return;
                }

                const updatedSpec = { ...existingSpec, ...updates };
                const putRequest = store.put(updatedSpec);

                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }
}