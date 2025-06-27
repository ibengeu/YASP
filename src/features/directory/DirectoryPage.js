"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card.tsx";
import { Button } from "@/core/components/ui/button.tsx";
import { Download, FileJson, Plus, Search, SortAsc, Tag, Trash2 } from "lucide-react";
import { Input } from "@/core/components/ui/input.tsx";
import { useNavigate } from "react-router";
import { cn } from "@/core/lib/utils.ts";
import { IndexedDBService } from "@/core/services/indexdbservice.ts";
import { SwaggerInput } from "./components/swagger-input.tsx";
import { Badge } from "@/core/components/ui/badge.tsx";
export function DirectoryPage() {
    const navigate = useNavigate();
    const [specs, setSpecs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dbService = new IndexedDBService();
    useEffect(() => {
        loadSpecs();
    }, []);
    const loadSpecs = async () => {
        setIsLoading(true);
        try {
            const allSpecs = await dbService.getAllSpecs();
            setSpecs(allSpecs);
        }
        catch (error) {
            console.error("Error loading specs:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSpecLoaded = async (loadedSpec) => {
        try {
            const id = await dbService.saveSpec(loadedSpec);
            navigate(`/spec/${id}`);
        }
        catch (error) {
            console.error("Error saving spec:", error);
        }
    };
    const handleRemoveSpec = async (event, specId) => {
        event.stopPropagation();
        if (window.confirm("Are you sure you want to remove this specification?")) {
            await dbService.deleteSpec(specId);
            await loadSpecs();
        }
    };
    const filteredAndSortedSpecs = specs
        .filter((spec) => spec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (spec.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.title.localeCompare(b.title));
    const groupedSpecs = filteredAndSortedSpecs.reduce((acc, spec) => {
        const firstLetter = spec.title[0].toUpperCase();
        if (!acc[firstLetter])
            acc[firstLetter] = [];
        acc[firstLetter].push(spec);
        return acc;
    }, {});
    const getTimeAgo = (date) => {
        const now = new Date();
        const createdDate = new Date(date);
        const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffInDays === 0)
            return "Today";
        if (diffInDays === 1)
            return "Yesterday";
        if (diffInDays < 7)
            return `${diffInDays} days ago`;
        if (diffInDays < 30)
            return `${Math.floor(diffInDays / 7)} weeks ago`;
        return `${Math.floor(diffInDays / 30)} months ago`;
    };
    // Check if spec was added recently (within last 7 days)
    const isRecentlyAdded = (date) => {
        const now = new Date();
        const createdDate = new Date(date);
        const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffInDays <= 7;
    };
    if (showInput) {
        return (_jsxs("div", { className: "container mx-auto flex-1 px-4", children: [_jsx("div", { className: "py-4", children: _jsxs(Button, { variant: "outline", onClick: () => setShowInput(false), className: "mb-4", children: [_jsx("span", { className: "mr-2", children: "\u2190" }), "Back to Directory"] }) }), _jsx("div", { className: "flex min-h-[calc(100vh-8rem)] items-center justify-center", children: _jsx(SwaggerInput, { onSpecLoaded: handleSpecLoaded }) })] }));
    }
    return (_jsxs("div", { className: "container mx-auto py-6 px-4 md:px-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight mb-1", children: "API Specifications" }), _jsx("p", { className: "text-muted-foreground", children: "Manage and explore your OpenAPI collections" })] }), _jsxs(Button, { className: "gap-2 self-start", onClick: () => setShowInput(true), size: "default", children: [_jsx(Plus, { className: "h-4 w-4" }), "Add New Spec"] })] }), _jsxs("div", { className: "relative mb-8", children: [_jsxs("div", { className: "flex items-center border rounded-md bg-background pl-3 focus-within:ring-1 focus-within:ring-ring", children: [_jsx(Search, { className: "h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by title or description...", className: "border-0 focus-visible:ring-0 pl-2", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsxs("div", { className: "mt-2 flex items-center text-xs text-muted-foreground", children: [_jsx(SortAsc, { className: "h-3 w-3 mr-1" }), _jsx("span", { children: "Sorted alphabetically by title" })] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) })) : (_jsx(_Fragment, { children: Object.keys(groupedSpecs).length > 0 ? (_jsx("div", { className: "space-y-10", children: Object.entries(groupedSpecs).map(([letter, letterSpecs]) => (_jsxs("div", { className: "relative", children: [_jsxs("div", { className: "sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b py-2 mb-4 flex items-center", children: [_jsx("div", { className: "flex items-center justify-center bg-primary/10 rounded-full w-8 h-8 mr-2", children: _jsx("span", { className: "font-semibold text-primary", children: letter }) }), _jsxs("h2", { className: "text-lg font-medium", children: [letterSpecs.length, " Specification", letterSpecs.length !== 1 ? "s" : ""] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: letterSpecs.map((spec) => (_jsx(Card, { className: "hover:shadow-md transition-all duration-200 cursor-pointer group border-2 hover:border-primary/20", onClick: () => navigate(`/spec/${spec.id}`), children: _jsxs(CardHeader, { children: [_jsxs("div", { className: "flex justify-between items-start gap-2", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1 bg-primary/10 rounded-md p-1.5", children: _jsx(FileJson, { className: "h-4 w-4 text-primary" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs(CardTitle, { className: "flex items-center gap-2 leading-tight", children: [_jsx("span", { className: "truncate", children: spec.title }), isRecentlyAdded(spec.createdAt) && (_jsx(Badge, { variant: "outline", className: "text-xs bg-green-50 text-green-600 border-green-200", children: "New" }))] }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [_jsx(Tag, { className: "h-3 w-3 mr-1" }), "v", spec.version] }), _jsx("span", { className: "text-xs text-muted-foreground", children: getTimeAgo(spec.createdAt) })] })] })] }), _jsxs("div", { className: cn("flex items-center gap-1 shrink-0 transition-opacity duration-200", "opacity-0 group-hover:opacity-100"), children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-destructive", onClick: (e) => handleRemoveSpec(e, spec.id), "aria-label": "Remove specification", children: _jsx(Trash2, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-primary", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    // TODO: Implement download functionality
                                                                    // downloadSpec(spec, `${spec.title}-${spec.version}.json`)
                                                                }, "aria-label": "Download specification", children: _jsx(Download, { className: "h-4 w-4" }) })] })] }), spec.description && (_jsx(CardDescription, { className: "mt-3 line-clamp-2", children: spec.description }))] }) }, spec.id))) })] }, letter))) })) : (_jsx("div", { className: "bg-muted/30 border rounded-lg py-12 px-4 text-center", children: searchTerm ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Search, { className: "h-10 w-10 text-muted-foreground mx-auto" }), _jsx("h3", { className: "text-lg font-medium", children: "No matching specifications found" }), _jsxs("p", { className: "text-muted-foreground", children: ["Try adjusting your search query or", _jsx("br", {}), _jsx(Button, { variant: "link", className: "p-0 h-auto", onClick: () => setSearchTerm(""), children: "clear your search" })] })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsx(FileJson, { className: "h-12 w-12 text-muted-foreground mx-auto" }), _jsx("h3", { className: "text-lg font-medium", children: "No API specifications found" }), _jsx("p", { className: "text-muted-foreground max-w-md mx-auto", children: "Upload your first OpenAPI specification to get started with the API Collection tool" }), _jsxs(Button, { className: "mt-4 gap-2", onClick: () => setShowInput(true), children: [_jsx(Plus, { className: "h-4 w-4" }), "Add New Spec"] })] })) })) })), Object.keys(groupedSpecs).length > 5 && (_jsx("div", { className: "fixed right-4 bottom-4 md:hidden", children: _jsx(Button, { className: "h-12 w-12 rounded-full shadow-md", onClick: () => setShowInput(true), size: "icon", children: _jsx(Plus, { className: "h-5 w-5" }) }) }))] }));
}
