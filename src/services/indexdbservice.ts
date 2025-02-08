interface StoredSpec {
    id?: number;
    title: string;
    version: string;
    description?: string;
    spec: any;
    createdAt: string;
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

    async saveSpec(spec: any): Promise<number> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const storedSpec: StoredSpec = {
                title: spec.info.title,
                version: spec.info.version,
                description: spec.info.description,
                spec: spec,
                createdAt: new Date().toISOString()
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
}