import { OpenApiDocument } from "@/common/openapi-spec";

interface StoredSpec {
    id?: number;
    title: string;
    version: string;
    description?: string;
    spec: OpenApiDocument;
    createdAt: string;
}
export declare class IndexedDBService {
    private dbName;
    private version;
    private storeName;
    initDB(): Promise<IDBDatabase>;
    getSpecById(id: number): Promise<StoredSpec | null>;
    deleteSpec(id: string | number): Promise<void>;
    checkSpecExists(title: string, version: string): Promise<boolean>;
    saveSpec(spec: OpenApiDocument): Promise<number>;
    getAllSpecs(): Promise<StoredSpec[]>;
}
export {};
