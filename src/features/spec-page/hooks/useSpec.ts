import {useCallback, useEffect, useState} from "react";
import {OpenApiDocument} from "@/common/openapi-spec";
import {IndexedDBService} from "@/core/services/indexdbservice";

const dbService = new IndexedDBService();

function validateSpec(spec: unknown): spec is OpenApiDocument {
    if (typeof spec !== "object" || spec === null) return false;
    const s = spec as Partial<OpenApiDocument>;
    return !!(
        s.openapi?.startsWith("3.") &&
        s.info?.title &&
        s.info?.version &&
        s.paths && Object.keys(s.paths).length > 0
    );
}

export function useSpec(id: string | undefined) {
    const [spec, setSpec] = useState<OpenApiDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSpec = useCallback(async () => {
        if (!id) {
            setError("No specification ID provided");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const loadedSpec = await dbService.getSpecById(Number(id));
            if (!loadedSpec || !loadedSpec.spec) {
                throw new Error("Specification not found");
            }
            if (!validateSpec(loadedSpec.spec)) {
                throw new Error("Invalid OpenAPI specification format");
            }
            setSpec(loadedSpec.spec);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load specification");
            console.error("Error loading spec:", err);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadSpec();
    }, [loadSpec]);

    return {spec, isLoading, error, retry: loadSpec};
}
