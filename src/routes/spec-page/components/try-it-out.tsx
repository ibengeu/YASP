"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { executeApiRequest, ExecuteRequestForm } from "@/routes/spec-page/actions/execute-api-request";
import {
    ComponentsObject,
    OperationObject,
    ParameterObject,
    RequestBodyObject,
    SchemaObject,
    ReferenceObject,
} from "@/common/openapi-spec.ts";

// Utility functions
export function isReferenceObject(obj: unknown): obj is ReferenceObject {
    return obj !== null && typeof obj === "object" && "$ref" in obj;
}

export function resolveReference<T>(
    obj: T | ReferenceObject | undefined,
    components: ComponentsObject,
    visitedRefs: Set<string> = new Set()
): T | null {
    if (!obj) return null;
    if (isReferenceObject(obj)) {
        const refPath = obj.$ref.split("/");
        if (refPath[0] !== "#" || refPath[1] !== "components") {
            console.error(`Invalid reference: ${obj.$ref}`);
            return null;
        }
        const componentType = refPath[2];
        const componentName = refPath[3];
        const component = components[componentType as keyof ComponentsObject]?.[componentName];
        if (!component) {
            console.error(`Reference not found: ${obj.$ref}`);
            return null;
        }
        if (visitedRefs.has(obj.$ref)) {
            console.warn(`Circular reference detected: ${obj.$ref}`);
            return null;
        }
        visitedRefs.add(obj.$ref);
        return resolveReference(component as T | ReferenceObject, components, visitedRefs);
    }
    return obj as T;
}

// Extended SchemaObject interface with additional properties
interface ExtendedSchemaObject extends SchemaObject {
    type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
    properties?: Record<string, SchemaObject | ReferenceObject>;
    items?: SchemaObject | ReferenceObject;
    required?: string[];
    enum?: (string | number | boolean)[];
    default?: string | number | boolean | object;
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
}

// Type definitions
type ParameterValue = string | number | boolean;
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface ResponseData {
    status: number;
    body: string;
    headers: Record<string, string>;
    time?: number;
}

interface Header {
    name: string;
    value: string;
}

interface TryItOutProps {
    path: string;
    method: string;
    operation: OperationObject;
    components: ComponentsObject;
}

export default function TryItOut({
    path,
    method,
    operation,
    components,
}: TryItOutProps) {
    const [parameters, setParameters] = useState<Record<string, ParameterValue>>({});
    const [requestBody, setRequestBody] = useState<string>("{}");
    const [headers, setHeaders] = useState<Header[]>([
        { name: "Accept", value: "*/*" },
        { name: "Content-Type", value: "application/json" },
    ]);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<string>("params");
    const [newHeaderName, setNewHeaderName] = useState<string>("");
    const [newHeaderValue, setNewHeaderValue] = useState<string>("");
    const [baseUrl] = useState<string>("https://api.example.com");
    const [selectedMethod, setSelectedMethod] = useState<string>(method.toUpperCase());
    const [urlPath, setUrlPath] = useState<string>(path);

    const { handleSubmit } = useForm<{ requestData: string }>({
        defaultValues: { requestData: "" },
    });

    const MAX_BODY_SIZE = 1024 * 1024; // 1MB
    const MAX_HEADER_SIZE = 1024; // 1KB

    const sanitizeInput = (input: string): string => {
        return input.replace(/[<>]/g, "");
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    // Resolve parameters
    const resolvedParameters = useMemo(
        () =>
            (operation.parameters || [])
                .map((param) => resolveReference<ParameterObject>(param, components))
                .filter((p): p is ParameterObject => p !== null),
        [operation.parameters, components]
    );

    // Resolve requestBody
    const resolvedRequestBody = resolveReference<RequestBodyObject>(
        operation.requestBody,
        components
    );

    const convertSwaggerToZod = (
        schema: SchemaObject | ReferenceObject | undefined
    ): z.ZodTypeAny => {
        const resolvedSchema = resolveReference<ExtendedSchemaObject>(schema, components);
        if (!resolvedSchema) return z.unknown();

        // Missing type field handling
        if (!resolvedSchema.type) {
            if (resolvedSchema.enum) {
                return z.enum(resolvedSchema.enum as [string, ...string[]]);
            }
            return z.unknown();
        }

        switch (resolvedSchema.type) {
            case "object": {
                const obj: Record<string, z.ZodTypeAny> = {};
                if (resolvedSchema.properties) {
                    Object.entries(resolvedSchema.properties).forEach(([key, prop]) => {
                        obj[key] = convertSwaggerToZod(prop);
                        if (!resolvedSchema.required?.includes(key)) {
                            obj[key] = obj[key].optional();
                        }
                    });
                }
                return z.object(obj);
            }
            case "array": {
                const items = resolvedSchema.items
                    ? convertSwaggerToZod(resolvedSchema.items)
                    : z.unknown();
                return z.array(items);
            }
            case "string": {
                if (resolvedSchema.format === "uuid") return z.string().uuid();
                if (resolvedSchema.format === "email") return z.string().email();
                if (resolvedSchema.format === "date-time") return z.string().datetime();
                if (resolvedSchema.pattern)
                    return z.string().regex(new RegExp(resolvedSchema.pattern));
                return z.string();
            }
            case "number":
            case "integer": {
                let zodType =
                    resolvedSchema.type === "integer" ? z.number().int() : z.number();
                if (resolvedSchema.minimum !== undefined)
                    zodType = zodType.min(resolvedSchema.minimum);
                if (resolvedSchema.maximum !== undefined)
                    zodType = zodType.max(resolvedSchema.maximum);
                return zodType;
            }
            case "boolean":
                return z.boolean();
            default:
                return z.unknown();
        }
    };

    const generateSampleFromSchema = (
        schema: SchemaObject | ReferenceObject | undefined,
        components: ComponentsObject,
        depth: number = 0
    ): JsonValue => {
        if (!schema || depth > 10) return null;
        const resolvedSchema = resolveReference<ExtendedSchemaObject>(schema, components);
        if (!resolvedSchema) return null;

        if (resolvedSchema.example !== undefined) return resolvedSchema.example as JsonValue;
        if (resolvedSchema.default !== undefined) return resolvedSchema.default as JsonValue;
        if (resolvedSchema.enum && resolvedSchema.enum.length > 0)
            return resolvedSchema.enum[0];

        switch (resolvedSchema.type) {
            case "object": {
                const obj: JsonObject = {};
                if (resolvedSchema.properties) {
                    Object.entries(resolvedSchema.properties).forEach(([key, prop]) => {
                        if (resolvedSchema.required?.includes(key)) {
                            obj[key] = generateSampleFromSchema(prop, components, depth + 1);
                        }
                    });
                }
                return obj;
            }
            case "array": {
                if (resolvedSchema.items) {
                    return [generateSampleFromSchema(resolvedSchema.items, components, depth + 1)];
                }
                return [];
            }
            case "string": {
                if (resolvedSchema.format === "uuid") return uuidv4();
                if (resolvedSchema.format === "date-time")
                    return new Date().toISOString();
                return "example";
            }
            case "number":
            case "integer":
                return resolvedSchema.type === "integer" ? 1 : 1.0;
            case "boolean":
                return true;
            default:
                return null;
        }
    };

    const requestBodySchema = useMemo(() => {
        if (!resolvedRequestBody?.content) return null;
        const contentType = Object.keys(resolvedRequestBody.content)[0] || "application/json";
        return resolvedRequestBody.content[contentType]?.schema;
    }, [resolvedRequestBody]);

    // Generate cURL command
    const generateCurlCommand = useMemo(() => {
        const fullUrl = `${baseUrl}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
        let curl = `curl -X ${selectedMethod} "${fullUrl}"`;
        
        headers.forEach((header) => {
            if (header.name && header.value) {
                curl += ` \\\n  -H "${header.name}: ${header.value}"`;
            }
        });
        
        if (["POST", "PUT", "PATCH"].includes(selectedMethod) && requestBody && requestBody.trim() !== "{}") {
            try {
                const formattedBody = JSON.stringify(JSON.parse(requestBody));
                curl += ` \\\n  -d '${formattedBody}'`;
            } catch {
                curl += ` \\\n  -d '${requestBody}'`;
            }
        }
        
        return curl;
    }, [baseUrl, urlPath, selectedMethod, headers, requestBody]);

    // Initialize request body with sample data
    useEffect(() => {
        if (
            ["post", "put", "patch"].includes(method.toLowerCase()) &&
            requestBodySchema
        ) {
            const sample = generateSampleFromSchema(requestBodySchema, components);
            try {
                setRequestBody(JSON.stringify(sample || {}, null, 2));
            } catch {
                setRequestBody("{}");
            }
        }
    }, [method, requestBodySchema, components]);

    const handleParameterChange = (name: string, value: string) => {
        const param = resolvedParameters.find((p) => p.name === name);
        if (!param) return;
        let parsedValue: ParameterValue = value;
        const schema = resolveReference<ExtendedSchemaObject>(param.schema, components);
        if (schema) {
            if (schema.type === "number" || schema.type === "integer") {
                parsedValue = Number(value) || value;
            } else if (schema.type === "boolean") {
                parsedValue = value.toLowerCase() === "true";
            }
        }
        setParameters((prev) => ({ ...prev, [name]: parsedValue }));
    };

    const handleRequestBodyChange = (value: string) => {
        if (value.length > MAX_BODY_SIZE) {
            toast.error("Request body exceeds maximum size of 1MB.");
            return;
        }
        setRequestBody(value);
        if (requestBodySchema) {
            try {
                const parsed = JSON.parse(value);
                const zodSchema = convertSwaggerToZod(requestBodySchema);
                if (!zodSchema.safeParse(parsed).success) {
                    toast.warning("Request body does not match schema.");
                }
            } catch {
                // Allow partial JSON during typing
            }
        }
    };

    const formatJson = () => {
        try {
            const formatted = JSON.stringify(JSON.parse(requestBody), null, 2);
            setRequestBody(formatted);
            toast.success("JSON formatted successfully.");
        } catch {
            toast.error("Invalid JSON format.");
        }
    };

    const addHeader = () => {
        if (!newHeaderName.trim()) return;
        if (newHeaderName.length > MAX_HEADER_SIZE || newHeaderValue.length > MAX_HEADER_SIZE) {
            toast.error("Header name or value exceeds maximum size of 1KB.");
            return;
        }
        const sanitizedName = sanitizeInput(newHeaderName);
        const sanitizedValue = sanitizeInput(newHeaderValue);
        setHeaders((prev) => [...prev, { name: sanitizedName, value: sanitizedValue }]);
        setNewHeaderName("");
        setNewHeaderValue("");
    };

    const removeHeader = (index: number) => {
        setHeaders((prev) => prev.filter((_, i) => i !== index));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
    };

    const handleExecute = async (data: { requestData: string }) => {
        startTransition(async () => {
            setResponse(null);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const formData = new FormData();
            formData.append("requestData", data.requestData);
            try {
                const responseData = await executeApiRequest(formData);
                clearTimeout(timeoutId);
                setResponse(responseData);
                toast.success(`Request successful: ${responseData.status}`);
            } catch (error) {
                clearTimeout(timeoutId);
                toast.error("Request failed.");
                setResponse({
                    status: 500,
                    body: JSON.stringify({ error: "Request failed" }, null, 2),
                    headers: { "content-type": "application/json" },
                });
            }
        });
    };

    const onSubmit = handleSubmit(() => {
        const fullUrl = `${baseUrl}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
        if (!isValidUrl(fullUrl)) {
            toast.error("Invalid URL.");
            return;
        }

        const requestData: ExecuteRequestForm = {
            method: selectedMethod.toLowerCase(),
            path: urlPath,
            baseUrl,
            parameters,
            requestBody,
            headers,
        };

        handleExecute({ requestData: JSON.stringify(requestData) });
    });

    const renderParameterInputs = () => {
        if (resolvedParameters.length === 0) {
            return <div className="text-center py-6 text-muted-foreground">No parameters</div>;
        }

        const groupedParams: Record<string, ParameterObject[]> = {};
        resolvedParameters.forEach((param) => {
            const paramIn = param.in || "query";
            if (!groupedParams[paramIn]) groupedParams[paramIn] = [];
            groupedParams[paramIn].push(param);
        });

        return (
            <ScrollArea className="max-h-[400px]">
                <div className="space-y-6">
                    {Object.entries(groupedParams).map(([paramType, params]) => (
                        <div key={paramType} className="space-y-4">
                            <h3 className="text-sm font-semibold capitalize">{paramType} Parameters</h3>
                            {params.map((param) => (
                                <div key={param.name} className="space-y-2">
                                    <label htmlFor={`param-${param.name}`}>{param.name}</label>
                                    <Input
                                        id={`param-${param.name}`}
                                        value={parameters[param.name]?.toString() || ""}
                                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                        placeholder={param.example?.toString() || `Enter ${param.name}`}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    };

    const renderHeadersInput = () => (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">Headers</h3>
            {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                    <Input
                        value={header.name}
                        onChange={(e) => {
                            const newHeaders = [...headers];
                            newHeaders[index].name = sanitizeInput(e.target.value);
                            setHeaders(newHeaders);
                        }}
                        placeholder="Header name"
                    />
                    <Input
                        value={header.value}
                        onChange={(e) => {
                            const newHeaders = [...headers];
                            newHeaders[index].value = sanitizeInput(e.target.value);
                            setHeaders(newHeaders);
                        }}
                        placeholder="Value"
                    />
                    <Button variant="ghost" onClick={() => removeHeader(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <div className="flex gap-2">
                <Input
                    value={newHeaderName}
                    onChange={(e) => setNewHeaderName(e.target.value)}
                    placeholder="Header name"
                />
                <Input
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                    placeholder="Value"
                />
                <Button onClick={addHeader} disabled={!newHeaderName.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const renderBodyInput = () => {
        // Show body tab for methods that typically have a body
        if (!["POST", "PUT", "PATCH"].includes(selectedMethod)) return null;
        
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-medium">Request Body</h3>
                <Textarea
                    value={requestBody}
                    onChange={(e) => handleRequestBodyChange(e.target.value)}
                    placeholder="Enter request body"
                    className="font-mono min-h-[200px]"
                />
                <Button onClick={formatJson}>Format JSON</Button>
            </div>
        );
    };

    const renderCurlInput = () => (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">cURL Command</h3>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                {generateCurlCommand}
            </pre>
            <Button onClick={() => copyToClipboard(generateCurlCommand)}>Copy</Button>
        </div>
    );

    return (
        <div className="h-full overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            value={`${baseUrl}${urlPath}`}
                            onChange={(e) => setUrlPath(e.target.value.replace(baseUrl, ""))}
                            className="flex-1"
                        />
                        <Button onClick={onSubmit} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Send"}
                        </Button>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList>
                            <TabsTrigger value="params">Params</TabsTrigger>
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            <TabsTrigger value="body">Body</TabsTrigger>
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="params" className="mt-4">
                            {renderParameterInputs()}
                        </TabsContent>
                        <TabsContent value="headers" className="mt-4">
                            {renderHeadersInput()}
                        </TabsContent>
                        <TabsContent value="body" className="mt-4">
                            {renderBodyInput()}
                        </TabsContent>
                        <TabsContent value="curl" className="mt-4">
                            {renderCurlInput()}
                        </TabsContent>
                    </Tabs>
                    
                    {response && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">Response</h3>
                                <span className={`px-2 py-1 rounded text-sm ${
                                    response.status >= 200 && response.status < 300 
                                        ? 'bg-green-100 text-green-800' 
                                        : response.status >= 400 
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {response.status}
                                </span>
                                {response.time && (
                                    <span className="text-sm text-muted-foreground">
                                        {response.time}ms
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Headers</h4>
                                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                    {JSON.stringify(response.headers, null, 2)}
                                </pre>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Body</h4>
                                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-96">
                                    {response.body}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}