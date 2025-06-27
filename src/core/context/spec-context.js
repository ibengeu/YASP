import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { IndexedDBService } from "../../core/services/indexdbservice";
import { useNavigate } from "react-router";
const SpecContext = createContext(undefined);
export const SpecProvider = ({ children }) => {
    const [specs, setSpecs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const dbService = new IndexedDBService();
    const navigate = useNavigate();
    const loadSpecs = useCallback(async () => {
        setIsLoading(true);
        try {
            const allSpecs = await dbService.getAllSpecs();
            setSpecs(allSpecs);
        }
        catch (err) {
            setError('Failed to load specifications');
            console.error('Error loading specs:', err);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const saveSpec = useCallback(async (spec) => {
        try {
            const id = await dbService.saveSpec(spec);
            await loadSpecs();
            navigate(`/spec/${id}`);
        }
        catch (err) {
            setError('Failed to save specification');
            console.error('Error saving spec:', err);
        }
    }, [loadSpecs, navigate]);
    const deleteSpec = useCallback(async (id) => {
        if (window.confirm('Are you sure you want to remove this specification?')) {
            try {
                await dbService.deleteSpec(id);
                await loadSpecs();
            }
            catch (err) {
                setError('Failed to delete specification');
                console.error('Error deleting spec:', err);
            }
        }
    }, [loadSpecs]);
    useEffect(() => {
        loadSpecs();
    }, [loadSpecs]);
    return (_jsx(SpecContext.Provider, { value: { specs, isLoading, error, loadSpecs, saveSpec, deleteSpec }, children: children }));
};
export const useSpecContext = () => {
    const context = useContext(SpecContext);
    if (!context) {
        throw new Error('useSpecContext must be used within a SpecProvider');
    }
    return context;
};
