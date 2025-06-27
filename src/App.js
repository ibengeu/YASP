import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Code, Database, FileJson, Search, Share2, Shield, Upload, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useCallback, useState } from "react";
import { IndexedDBService } from "@/core/services/indexdbservice.ts";
import { Button } from "@/core/components/ui/button.tsx";
import { cn } from "@/core/lib/utils.ts";
import { Alert, AlertDescription } from "@/core/components/ui/alert.tsx";
import { Card, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card.tsx";
export default function LandingPage() {
    const navigate = useNavigate();
    const [fileName, setFileName] = useState(null);
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(false);
    const dbService = new IndexedDBService();
    const extractOpenApiSpec = (content) => {
        if (content.spec && typeof content.spec === "object") {
            return content.spec;
        }
        if (content.openapi || content.swagger) {
            return content;
        }
        return null;
    };
    const validateAndLoadSpec = useCallback(async (content) => {
        setError(null);
        setIsValid(false);
        try {
            const spec = extractOpenApiSpec(content);
            if (!spec) {
                setError("Could not find valid OpenAPI specification");
                return false;
            }
            const version = spec.openapi || spec.swagger;
            if (!version) {
                setError("Missing OpenAPI/Swagger version identifier");
                return false;
            }
            if (!version.startsWith("3.")) {
                setError(`Unsupported OpenAPI version: ${version}. Only version 3.x is supported.`);
                return false;
            }
            if (!spec.info) {
                setError("Missing 'info' section in specification");
                return false;
            }
            if (!spec.paths) {
                setError("Missing 'paths' section in specification");
                return false;
            }
            setIsValid(true);
            try {
                const id = await dbService.saveSpec(spec);
                navigate(`/spec/${id}`);
                return true;
            }
            catch (error) {
                setError("Failed to save specification");
                console.error("Error saving spec:", error);
                return false;
            }
        }
        catch (err) {
            setError("Invalid specification format");
            return false;
        }
    }, [navigate]);
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
        reader.onerror = () => {
            setError("Error reading file");
        };
        reader.readAsText(file);
    }, [validateAndLoadSpec]);
    return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx("header", { className: "border border-muted bg-muted sticky top-0 z-10", children: _jsxs("div", { className: " mx-auto flex h-16 items-center justify-between px-4 bg-white", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileJson, { className: "h-6 w-6 text-primary" }), _jsx("span", { className: "text-xl font-semibold tracking-tight", children: "YASP" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("nav", { className: "hidden md:flex items-center gap-6", children: [_jsx(Link, { to: "#features", className: "text-sm font-medium hover:text-primary transition-colors", children: "Features" }), _jsx(Link, { to: "#benefits", className: "text-sm font-medium hover:text-primary transition-colors", children: "Benefits" }), _jsx(Link, { to: "#get-started", className: "text-sm font-medium hover:text-primary transition-colors", children: "Get Started" })] }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/app", children: "Launch App" }) })] })] }) }), _jsxs("main", { className: "flex-1", children: [_jsx("section", { className: "py-20 md:py-28 bg-muted min-h-screen bg-white", children: _jsx("div", { className: "px-4 md:px-20 w-full", children: _jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]", children: [_jsxs("div", { className: "flex flex-col justify-center space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none", children: "Manage Your API Collections with Ease" }), _jsx("p", { className: "max-w-[600px] md:text-xl", children: "A powerful tool for developers to upload, organize, and explore OpenAPI specifications in one centralized location." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Button, { size: "lg", asChild: true, children: _jsx(Link, { to: "/app", children: "Get Started" }) }), _jsx(Button, { size: "lg", variant: "outline", asChild: true, children: _jsx(Link, { to: "#features", children: "Learn More" }) })] })] }), _jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "w-full max-w-md space-y-4", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Upload your OpenAPI 3.x JSON specification to get started:" }), _jsx("div", { className: cn("flex flex-col justify-center items-center border-2 border-dashed rounded-lg p-6 transition-colors bg-background", fileName && isValid ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "border-muted-foreground/20"), children: fileName && isValid ? (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center", children: _jsx(FileJson, { className: "h-6 w-6 text-green-600 dark:text-green-400", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileJson, { className: "h-5 w-5 text-muted-foreground" }), _jsx("span", { className: "font-medium", children: fileName })] }), _jsx("p", { className: "text-sm text-green-600 dark:text-green-400", children: "Specification loaded successfully!" })] })) : (_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto", children: _jsx(Upload, { className: "h-6 w-6 text-muted-foreground", "aria-hidden": "true" }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Upload your OpenAPI JSON file here" }), _jsxs(Button, { variant: "secondary", className: "relative", children: ["Select OpenAPI File", _jsx("input", { type: "file", className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", accept: "application/json,.json", onChange: handleFileUpload, "aria-label": "Upload OpenAPI specification file" })] })] })) }), error && (_jsxs(Alert, { variant: "destructive", className: "animate-in fade-in-0 zoom-in-95 duration-300", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "ml-2", children: error })] }))] }) })] }) }) }), _jsx("section", { id: "features", className: "py-20 bg-background bg-secondary", children: _jsxs("div", { className: "px-4 md:px-20", children: [_jsx("div", { className: "flex flex-col items-center justify-center space-y-4 text-center", children: _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl", children: "Key Features" }), _jsx("p", { className: "max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed", children: "Everything you need to manage and explore your API specifications" })] }) }), _jsxs("div", { className: "mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3", children: [_jsx(Card, { className: " transition-all hover:border-primary/50 hover:shadow-md", children: _jsxs(CardHeader, { children: [_jsx(FileJson, { className: "h-10 w-10 text-primary mb-2" }), _jsx(CardTitle, { children: "OpenAPI Support" }), _jsx(CardDescription, { children: "Upload and parse OpenAPI 3.x specifications with automatic validation" })] }) }), _jsx(Card, { className: " transition-all hover:border-primary/50 hover:shadow-md", children: _jsxs(CardHeader, { children: [_jsx(Database, { className: "h-10 w-10 text-primary mb-2" }), _jsx(CardTitle, { children: "Local Storage" }), _jsx(CardDescription, { children: "Save your API specifications locally using IndexedDB for quick access" })] }) }), _jsx(Card, { className: " transition-all hover:border-primary/50 hover:shadow-md", children: _jsxs(CardHeader, { children: [_jsx(Search, { className: "h-10 w-10 text-primary mb-2" }), _jsx(CardTitle, { children: "Powerful Search" }), _jsx(CardDescription, { children: "Quickly find the APIs you need with our powerful search functionality" })] }) }), _jsx(Card, { className: " transition-all hover:border-primary/50 hover:shadow-md", children: _jsxs(CardHeader, { children: [_jsx(Code, { className: "h-10 w-10 text-primary mb-2" }), _jsx(CardTitle, { children: "Interactive UI" }), _jsx(CardDescription, { children: "Explore endpoints, request bodies, and responses with our interactive UI" })] }) }), _jsx(Card, { className: " transition-all hover:border-primary/50 hover:shadow-md", children: _jsxs(CardHeader, { children: [_jsx(Zap, { className: "h-10 w-10 text-primary mb-2" }), _jsx(CardTitle, { children: "Fast Performance" }), _jsx(CardDescription, { children: "Optimized for speed and efficiency, even with large API specifications" })] }) }), _jsx(Card, { className: " transition-all hover:border-primary/50 hover:shadow-md", children: _jsxs(CardHeader, { children: [_jsx(Share2, { className: "h-10 w-10 text-primary mb-2" }), _jsx(CardTitle, { children: "Export & Share" }), _jsx(CardDescription, { children: "Download and share your API specifications with your team" })] }) })] })] }) }), _jsx("section", { id: "benefits", className: "py-20 bg-white", children: _jsx("div", { className: "container px-4 md:px-20", children: _jsxs("div", { className: "grid gap-6 lg:grid-cols-[500px_1fr] lg:gap-12 xl:grid-cols-[550px_1fr]", children: [_jsx("div", { className: "relative flex items-center justify-center order-last lg:order-first", children: _jsxs("div", { className: "relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] rounded-lg overflow-hidden shadow-xl", children: [_jsx("img", { src: "/img_1.png", alt: "Developer using API Collection Tool", className: "object-cover h-full" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" })] }) }), _jsxs("div", { className: "flex flex-col justify-center space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl", children: "Why Developers Love Our Tool" }), _jsx("p", { className: "max-w-[600px] text-muted-foreground md:text-xl", children: "Streamline your API development workflow and improve collaboration with your team" })] }), _jsxs("ul", { className: "space-y-4", children: [_jsxs("li", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx(Shield, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Centralized API Documentation" }), _jsx("p", { className: "text-muted-foreground", children: "Keep all your API specifications in one place for easy access and management" })] })] }), _jsxs("li", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx(Shield, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Improved Developer Experience" }), _jsx("p", { className: "text-muted-foreground", children: "Interactive UI makes it easy to understand and work with complex APIs" })] })] }), _jsxs("li", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx(Shield, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Time-Saving Features" }), _jsx("p", { className: "text-muted-foreground", children: "Quickly find and understand API endpoints without digging through documentation" })] })] }), _jsxs("li", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx(Shield, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Better Collaboration" }), _jsx("p", { className: "text-muted-foreground", children: "Share API specifications with your team to ensure everyone is on the same page" })] })] })] })] })] }) }) }), _jsx("section", { id: "get-started", className: "py-20 bg-background", children: _jsx("div", { className: "px-4 md:px-20", children: _jsxs("div", { className: "flex flex-col items-center justify-center space-y-4 text-center", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl", children: "Ready to Streamline Your API Workflow?" }), _jsx("p", { className: "max-w-[600px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed", children: "Get started with our API Collection tool today and experience the difference" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 pt-4", children: [_jsx(Button, { size: "lg", asChild: true, children: _jsx(Link, { to: "/app", children: "Launch App" }) }), _jsx(Button, { size: "lg", variant: "outline", asChild: true, children: _jsx(Link, { to: "#features", children: "Learn More" }) })] })] }) }) })] }), _jsx("footer", { className: "bg-secondary py-6 md:py-8", children: _jsxs("div", { className: "container flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 md:px-20", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileJson, { className: "h-5 w-5 text-primary" }), _jsx("span", { className: "text-sm font-semibold", children: "YASP API Collection" })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u00A9 ", new Date().getFullYear(), " API Collection. All rights reserved."] }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Link, { to: "#", className: "text-sm text-muted-foreground hover:text-foreground transition-colors", children: "Privacy Policy" }), _jsx(Link, { to: "#", className: "text-sm text-muted-foreground hover:text-foreground transition-colors", children: "Terms of Service" })] })] }) })] }));
}
