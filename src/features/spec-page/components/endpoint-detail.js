"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../core/components/ui/badge";
import { cn } from "../../../core/lib/utils";
import { ScrollArea } from "../../../core/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../core/components/ui/tabs";
import { SchemaTable } from "./schema-table";
const methodColors = {
    get: "bg-blue-500",
    post: "bg-green-500",
    put: "bg-orange-500",
    delete: "bg-red-500",
    patch: "bg-yellow-500",
    options: "bg-purple-500",
    head: "bg-cyan-500",
    trace: "bg-indigo-500",
};
export const EndpointDetail = ({ path, method, operation, components }) => {
    const [selectedContentType, setSelectedContentType] = useState(null);
    const [selectedResponseTypes, setSelectedResponseTypes] = useState({});
    // Use operation.requestBody directly, assuming it's already resolved
    const requestBody = useMemo(() => operation.requestBody, [operation.requestBody]);
    // Use operation.parameters directly, assuming they are already resolved
    const parameters = useMemo(() => (operation.parameters ?? []), [operation.parameters]);
    // Use operation.responses directly, assuming they are already resolved
    const responses = useMemo(() => (operation.responses ?? {}), [operation.responses]);
    const contentTypes = useMemo(() => (requestBody?.content ? Object.keys(requestBody.content) : []), [requestBody]);
    // Set default content type for request body
    useEffect(() => {
        if (contentTypes.length > 0 && selectedContentType === null) {
            setSelectedContentType(contentTypes[0]);
        }
    }, [contentTypes, selectedContentType]);
    // Set default content types for responses
    useEffect(() => {
        const newResponseTypes = {};
        Object.entries(responses).forEach(([code, response]) => {
            if (response.content) {
                const responseContentTypes = Object.keys(response.content);
                if (responseContentTypes.length > 0 && !selectedResponseTypes[code]) {
                    newResponseTypes[code] = responseContentTypes[0];
                }
            }
        });
        if (Object.keys(newResponseTypes).length > 0) {
            setSelectedResponseTypes(prev => ({ ...prev, ...newResponseTypes }));
        }
    }, [responses, selectedResponseTypes]);
    const handleResponseTypeChange = (code, contentType) => {
        setSelectedResponseTypes(prev => ({ ...prev, [code]: contentType }));
    };
    // Updated getSchemaType to assume schema is already resolved
    const getSchemaType = (schema) => {
        if (!schema)
            return "-";
        let resolvedSchema;
        if ("$ref" in schema) {
            const refKey = schema.$ref.split("/").pop();
            resolvedSchema = components?.schemas?.[refKey];
        }
        else {
            resolvedSchema = schema;
        }
        if (!resolvedSchema)
            return "-";
        if (resolvedSchema.type) {
            if (resolvedSchema.type === "array" && resolvedSchema.items) {
                const itemSchema = resolvedSchema.items;
                const itemType = getSchemaType(itemSchema);
                return `array of ${itemType}`;
            }
            return resolvedSchema.type;
        }
        if (resolvedSchema.properties) {
            return "object";
        }
        return "any";
    };
    return (_jsx("div", { className: "h-full overflow-hidden bg-stone-50/70", children: _jsx(ScrollArea, { className: "h-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx(Badge, { className: cn("uppercase text-white", methodColors[method.toLowerCase()] ?? "bg-gray-500"), children: method }), _jsx("code", { className: "text-sm font-mono", children: path })] }), operation.summary && _jsx("h3", { className: "font-semibold mb-2", children: operation.summary }), operation.description && (_jsx("p", { className: "text-muted-foreground mb-6", children: operation.description })), parameters.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Parameters" }), _jsx("div", { className: "rounded-lg border border-border shadow-sm bg-background", children: parameters.map((parameter, index) => (_jsxs("div", { className: cn("flex flex-col py-3 px-4 border-b border-border/50 last:border-0", "hover:bg-muted/50 transition-colors"), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-sm font-medium text-foreground truncate", children: parameter.name }), _jsx(Badge, { variant: "outline", className: "text-xs bg-slate-100 text-slate-700", children: parameter.in })] }), _jsx("div", { className: "text-sm text-muted-foreground", children: getSchemaType(parameter.schema) })] }), _jsx(Badge, { variant: parameter.required ? "destructive" : "secondary", className: cn("text-xs font-medium", parameter.required
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-slate-100 text-slate-700"), children: parameter.required ? "Required" : "Optional" })] }), parameter.description && (_jsx("div", { className: "mt-1 text-sm text-muted-foreground pl-2", children: parameter.description }))] }, index))) })] })), requestBody?.content && selectedContentType && requestBody.content[selectedContentType]?.schema && (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Request Body" }), _jsx("div", { className: "mb-4", children: _jsx(SchemaTable, { schema: requestBody.content[selectedContentType].schema, components: components }) })] })), Object.keys(responses).length > 0 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Responses" }), Object.entries(responses).map(([code, response]) => {
                                if (!response) {
                                    return (_jsxs("div", { className: "mb-4", children: [_jsx(Badge, { variant: "outline", children: code }), _jsx("span", { className: "text-sm text-muted-foreground ml-2", children: "No response details" })] }, code));
                                }
                                const responseContentTypes = response.content ? Object.keys(response.content) : [];
                                const selectedResponseType = selectedResponseTypes[code] ?? responseContentTypes[0];
                                return (_jsxs("div", { className: "mb-6 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Badge, { variant: code.startsWith("2")
                                                        ? "default"
                                                        : code.startsWith("4") || code.startsWith("5")
                                                            ? "destructive"
                                                            : "outline", className: "text-sm", children: code }), _jsx("span", { className: "text-sm font-medium", children: response.description ?? "No description" })] }), response.content && responseContentTypes.length > 1 && (_jsx("div", { className: "mb-4", children: _jsxs(Tabs, { value: selectedResponseType, onValueChange: value => handleResponseTypeChange(code, value), className: "w-full", children: [_jsx(TabsList, { className: "mb-2 bg-stone-100/70", children: responseContentTypes.map(type => (_jsx(TabsTrigger, { value: type, className: "text-xs", children: type }, type))) }), responseContentTypes.map(contentType => (_jsx(TabsContent, { value: contentType, children: response.content && response.content[contentType]?.schema && (_jsx(SchemaTable, { schema: response.content[contentType].schema, components: components })) }, contentType)))] }) })), response.content &&
                                            responseContentTypes.length === 1 &&
                                            selectedResponseType && (_jsxs("div", { className: "mt-2", children: [_jsx(Badge, { variant: "outline", className: "mb-2", children: selectedResponseType }), response.content[selectedResponseType]?.schema && (_jsx(SchemaTable, { schema: response.content[selectedResponseType].schema, components: components }))] }))] }, code));
                            })] }))] }) }) }));
};
