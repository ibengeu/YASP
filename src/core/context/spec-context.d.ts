import React from 'react';
import { OpenApiDocument } from '@/common/openapi-spec.ts';
interface Spec {
    id: string | number;
    title: string;
    version: string;
    description?: string;
    createdAt: string | number | Date;
    spec: OpenApiDocument;
}
interface SpecContextType {
    specs: Spec[];
    isLoading: boolean;
    error: string | null;
    loadSpecs: () => Promise<void>;
    saveSpec: (spec: OpenApiDocument) => Promise<void>;
    deleteSpec: (id: string | number) => Promise<void>;
}
export declare const SpecProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useSpecContext: () => SpecContextType;
export {};
