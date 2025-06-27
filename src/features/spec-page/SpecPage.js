"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/core/components/ui/button";
import { IndexedDBService } from "@/core/services/indexdbservice";
import { SwaggerUI } from "./components/swagger-ui";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Sheet, SheetContent } from "@/core/components/ui/sheet";
import useMediaQuery from "@/core/hooks/useMediaQuery.ts";
import { TopBar } from "./components/top-bar.tsx";
import TryItOut from "./components/try-it-out.tsx";
export const SpecPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [spec, setSpec] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const dbService = new IndexedDBService();
    const isTablet = useMediaQuery("(min-width: 768px)");
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const validateSpec = (spec) => {
        if (typeof spec !== "object" || spec === null)
            return false;
        const s = spec;
        return !!(s.openapi?.startsWith("3.") &&
            s.info?.title &&
            s.info?.version &&
            s.paths && Object.keys(s.paths).length > 0);
    };
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load specification");
            console.error("Error loading spec:", err);
        }
        finally {
            setIsLoading(false);
        }
    }, [id]);
    useEffect(() => {
        loadSpec();
    }, [loadSpec]);
    if (error) {
        return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx(TopBar, { title: "API Documentation", isMobileMenuOpen: isMobileMenuOpen, toggleMobileMenu: toggleMobileMenu }), _jsxs("div", { className: "container mx-auto py-6 text-center flex-1", children: [_jsx("p", { className: "text-red-500 mb-4", children: error }), _jsx(Button, { onClick: loadSpec, variant: "outline", className: "mr-2", children: "Retry" }), _jsx(Button, { onClick: () => navigate("/"), variant: "outline", children: "Back to Directory" })] })] }));
    }
    return (_jsxs("div", { className: "flex flex-col h-screen bg-stone-50/30", children: [_jsx(TopBar, { title: "API Documentation", isMobileMenuOpen: isMobileMenuOpen, toggleMobileMenu: toggleMobileMenu }), _jsx("main", { className: "flex-1 overflow-hidden", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary", "aria-label": "Loading specification" }) })) : spec ? (_jsxs(_Fragment, { children: [_jsx(SwaggerUI, { spec: spec, onEndpointSelected: setSelectedEndpoint }), !isTablet && selectedEndpoint && (_jsx(Sheet, { open: !!selectedEndpoint, onOpenChange: () => setSelectedEndpoint(null), children: _jsx(SheetContent, { side: "bottom", className: "h-[80vh] p-0", children: _jsx(TryItOut, { path: selectedEndpoint.path, method: selectedEndpoint.method, operation: selectedEndpoint.operation, components: spec.components || {} }) }) }))] })) : null })] }));
};
