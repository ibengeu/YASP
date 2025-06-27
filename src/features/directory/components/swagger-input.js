
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { AlertCircle, Check, FileJson, Upload } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Textarea } from "@/core/components/ui/textarea";
import { Alert, AlertDescription } from "@/core/components/ui/alert.tsx";
import { cn } from "@/core/lib/utils";
export function SwaggerInput({ onSpecLoaded }) {
    const [error, setError] = useState(null);
    const [pastedContent, setPastedContent] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState(null);
    const [isValid, setIsValid] = useState(false);
    const validateAndLoadSpec = useCallback((content) => {
        setError(null);
        setIsValid(false);
        try {
            if (typeof content !== "object" || content === null) {
                setError("Specification must be a JSON object");
                return false;
            }
            const spec = content;
            if (!spec.openapi) {
                setError("Missing 'openapi' field");
                return false;
            }
            if (!spec.openapi.startsWith("3.")) {
                setError(`Unsupported OpenAPI version: ${spec.openapi}. Only version 3.x is supported.`);
                return false;
            }
            if (!spec.info) {
                setError("Missing 'info' section");
                return false;
            }
            if (!spec.info.title) {
                setError("Missing 'title' in 'info' section");
                return false;
            }
            if (!spec.info.version) {
                setError("Missing 'version' in 'info' section");
                return false;
            }
            if (!spec.paths || Object.keys(spec.paths).length === 0) {
                setError("Missing or empty 'paths' section");
                return false;
            }
            setIsValid(true);
            onSpecLoaded(spec);
            return true;
        }
        catch (err) {
            setError("Invalid specification format");
            return false;
        }
    }, [onSpecLoaded]);
    const handleFileUpload = useCallback((event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.includes("json") && !file.name.endsWith(".json")) {
            setError("Please upload a JSON file");
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target?.result);
                validateAndLoadSpec(content);
            }
            catch (err) {
                setError("Invalid JSON file format");
            }
        };
        reader.onerror = () => setError("Error reading file");
        reader.readAsText(file);
    }, [validateAndLoadSpec]);
    const handlePasteChange = useCallback((event) => {
        const content = event.target.value;
        setPastedContent(content);
        if (!content.trim()) {
            setError(null);
            setIsValid(false);
            return;
        }
        try {
            const parsedContent = JSON.parse(content);
            validateAndLoadSpec(parsedContent);
        }
        catch (err) {
            setError("Invalid JSON format. Please check your input.");
        }
    }, [validateAndLoadSpec]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file)
            return;
        if (!file.type.includes("json") && !file.name.endsWith(".json")) {
            setError("Please upload a JSON file");
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target?.result);
                validateAndLoadSpec(content);
            }
            catch (err) {
                setError("Invalid JSON file format");
            }
        };
        reader.onerror = () => setError("Error reading file");
        reader.readAsText(file);
    }, [validateAndLoadSpec]);
    return (_jsxs("div", { className: "space-y-8 max-w-3xl mx-auto", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Load OpenAPI Specification" }), _jsx("p", { className: "text-muted-foreground", children: "Upload a JSON file or paste your OpenAPI 3.x specification below" })] }), _jsx("div", { className: cn("flex flex-col justify-center items-center border-2 border-dashed rounded-lg p-8 transition-colors", isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20", fileName && isValid ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : ""), onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: _jsx("div", { className: "text-center space-y-4", children: fileName && isValid ? (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center", children: _jsx(Check, { className: "h-6 w-6 text-green-600 dark:text-green-400", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileJson, { className: "h-5 w-5 text-muted-foreground" }), _jsx("span", { className: "font-medium", children: fileName })] }), _jsx("p", { className: "text-sm text-green-600 dark:text-green-400", children: "Specification loaded successfully!" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto", children: _jsx(Upload, { className: "h-6 w-6 text-muted-foreground", "aria-hidden": "true" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Drag and drop your OpenAPI JSON file here, or" }), _jsxs(Button, { variant: "secondary", className: "relative", children: ["Select OpenAPI file", _jsx("input", { type: "file", className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", accept: "application/json,.json", onChange: handleFileUpload, "aria-label": "Upload OpenAPI specification file" })] })] })] })) }) }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium block", children: "Or paste your OpenAPI specification:" }), _jsx(Textarea, { placeholder: "Paste your OpenAPI/Swagger JSON here...", className: cn("font-mono min-h-[200px] resize-y", isValid && pastedContent ? "border-green-300 focus-visible:ring-green-300" : ""), value: pastedContent, onChange: handlePasteChange, "aria-label": "OpenAPI specification input" }), isValid && pastedContent && (_jsxs("p", { className: "text-sm flex items-center gap-1.5 text-green-600", children: [_jsx(Check, { className: "h-4 w-4" }), "Valid OpenAPI 3.x specification"] }))] }), error && (_jsxs(Alert, { variant: "destructive", className: "animate-in fade-in-0 zoom-in-95 duration-300", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "ml-2", children: error })] }))] }));
}
