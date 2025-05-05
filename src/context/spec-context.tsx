import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {IndexedDBService} from '@/services/indexdbservice';
import {OpenApiDocument} from '@/common/swagger.types.ts';
import {useNavigate} from "react-router";

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

const SpecContext = createContext<SpecContextType | undefined>(undefined);

export const SpecProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [specs, setSpecs] = useState<Spec[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dbService = new IndexedDBService();
    const navigate = useNavigate();

    const loadSpecs = useCallback(async () => {
        setIsLoading(true);
        try {
            const allSpecs = await dbService.getAllSpecs();
            setSpecs(allSpecs as Spec[]);
        } catch (err) {
            setError('Failed to load specifications');
            console.error('Error loading specs:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveSpec = useCallback(
        async (spec: OpenApiDocument) => {
            try {
                const id = await dbService.saveSpec(spec);
                await loadSpecs();
                navigate(`/spec/${id}`);
            } catch (err) {
                setError('Failed to save specification');
                console.error('Error saving spec:', err);
            }
        },
        [loadSpecs, navigate],
    );

    const deleteSpec = useCallback(
        async (id: string | number) => {
            if (window.confirm('Are you sure you want to remove this specification?')) {
                try {
                    await dbService.deleteSpec(id);
                    await loadSpecs();
                } catch (err) {
                    setError('Failed to delete specification');
                    console.error('Error deleting spec:', err);
                }
            }
        },
        [loadSpecs],
    );

    useEffect(() => {
        loadSpecs();
    }, [loadSpecs]);

    return (
        <SpecContext.Provider value={{specs, isLoading, error, loadSpecs, saveSpec, deleteSpec}}>
            {children}
        </SpecContext.Provider>
    );
};

export const useSpecContext = () => {
    const context = useContext(SpecContext);
    if (!context) {
        throw new Error('useSpecContext must be used within a SpecProvider');
    }
    return context;
};