"use client";

import {useCallback, useEffect, useMemo, useState, useTransition} from "react";
import {
    ComponentsObject,
    OperationObject,
    ParameterObject,
    ReferenceObject,
    RequestBodyObject,
    SchemaObject,
    SecuritySchemeObject
} from "@/common/openapi-spec";
import {useForm} from "react-hook-form";
import {toast} from "sonner";
import {executeApiRequest, ExecuteRequestForm} from "@/features/spec-page/actions/execute-api-request";
import {ScrollArea} from "@/core/components/ui/scroll-area";
import {Input} from "@/core/components/ui/input";
import {Button} from "@/core/components/ui/button";
import {Loader2, Copy, Check, X, Plus} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/core/components/ui/select.tsx";
import {Textarea} from "@/core/components/ui/textarea";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/core/components/ui/tabs";
import {Checkbox} from "@/core/components/ui/checkbox";
import {Label} from "@/core/components/ui/label";


type ParameterValue = string | number | boolean | string[] | Record<string, unknown>;

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

interface SecurityInput {
    name: string;
    type: "query" | "header" | "cookie";
    value: string;
}

// FormData field types
interface FormDataField {
    name: string;
    type: 'string' | 'number' | 'integer' | 'boolean' | 'file' | 'array';
    format?: string;
    required?: boolean;
    description?: string;
    example?: any;
    enum?: any[];
    items?: FormDataField;
}

interface FormDataFieldValue {
    [fieldName: string]: string | number | boolean | File | File[] | string[] | (string | File)[];
}

interface TryItOutProps {
    path: string;
    method: string;
    operation: OperationObject;
    components: ComponentsObject;
}

export default function TryItOut({path, method, operation, components}: TryItOutProps) {
    const [parameters, setParameters] = useState<Record<string, ParameterValue>>({});
    const [requestBody, setRequestBody] = useState<string>("");
    const [headers, setHeaders] = useState<Header[]>([]);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [isPending, startTransition] = useTransition();
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedBody, setCopiedBody] = useState(false);
    const [copiedCurl, setCopiedCurl] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("body");

    const [selectedServer, setSelectedServer] = useState<string>(
        operation.servers?.[0]?.url || "https://api.example.com"
    );
    const [selectedContentType, setSelectedContentType] = useState<string>("");
    const [securityInputs, setSecurityInputs] = useState<SecurityInput[]>([]);
    const [formDataFields, setFormDataFields] = useState<FormDataField[]>([]);
    const [formDataValues, setFormDataValues] = useState<FormDataFieldValue>({});

    const {handleSubmit} = useForm<{ requestData: string }>({
        defaultValues: {requestData: ""},
    });

    const MAX_BODY_SIZE = 1024 * 1024; // 1MB


    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    method = method.toUpperCase();
    // Filter parameters (no reference resolution)
    const resolvedParameters = useMemo(
        () =>
            (operation.parameters || [])
                .filter((p): p is ParameterObject => !("$ref" in p)),
        [operation.parameters]
    );

    // Get requestBody (no reference resolution)
    const resolvedRequestBody = operation.requestBody && !("$ref" in operation.requestBody)
        ? operation.requestBody as RequestBodyObject
        : undefined;

    const defaultHeaders = useMemo(() => {
        const headers: Header[] = [];
        if (resolvedRequestBody?.content) {
            const contentType = Object.keys(resolvedRequestBody.content)[0] || "application/json";
            headers.push({name: "Content-Type", value: contentType});
            setSelectedContentType(contentType);
        }
        headers.push({name: "Accept", value: "*/*"});
        if (operation.responses) {
            Object.values(operation.responses).forEach((response) => {
                if (!("$ref" in response) && response.headers) {
                    Object.entries(response.headers).forEach(([name, header]) => {
                        if (!("$ref" in header) && header.example && !headers.some((h) => h.name === name)) {
                            headers.push({name, value: header.example.toString()});
                        }
                    });
                }
            });
        }
        return headers;
    }, [operation.responses, resolvedRequestBody]);

    useEffect(() => {
        setHeaders(defaultHeaders);
    }, [defaultHeaders]);

    const securityInputsInitial = useMemo(() => {
        const inputs: SecurityInput[] = [];
        operation.security?.forEach((scheme) => {
            Object.keys(scheme).forEach((schemeName) => {
                const securityScheme = components.securitySchemes?.[schemeName] as SecuritySchemeObject | undefined;

                // Skip undefined or ReferenceObject schemes
                if (!securityScheme || "$ref" in securityScheme) {
                    return;
                }

                if (securityScheme.type === "apiKey" && securityScheme.name && securityScheme.in) {
                    inputs.push({
                        name: securityScheme.name,
                        type: securityScheme.in,
                        value: "",
                    });
                }
                // Handle http security scheme with bearer (JWT) authentication
                else if (securityScheme.type === "http" && securityScheme.scheme === "bearer") {
                    inputs.push({
                        name: "Authorization",
                        type: "header",
                        value: "",
                    });
                }
            });
        });
        return inputs;
    }, [operation.security, components])

    useEffect(() => {
        setSecurityInputs(securityInputsInitial);
    }, [securityInputsInitial]);


    const requestBodySchema = useMemo(() => {
        if (!resolvedRequestBody?.content) return null;
        return resolvedRequestBody.content[selectedContentType]?.schema;
    }, [resolvedRequestBody, selectedContentType]);

    // Content types
    const contentTypes = useMemo(
        () => (resolvedRequestBody?.content ? Object.keys(resolvedRequestBody.content) : []),
        [resolvedRequestBody]
    );

    const resolveSchema = useCallback((currentSchema: SchemaObject | ReferenceObject | null | undefined): SchemaObject | ReferenceObject | null | undefined => {

        if (!currentSchema) {
            return currentSchema
        }

        if ("$ref" in currentSchema && currentSchema.$ref?.startsWith("#/components/schemas/")) {
            const refKey = currentSchema.$ref.split("/").pop()
            const resolved = components?.schemas?.[refKey as string]
            if (resolved && "$ref" in resolved) {
                // Handle nested references
                return resolveSchema(resolved)
            }

            return (resolved as SchemaObject)
        }
        return currentSchema as SchemaObject
    }, [components?.schemas]);

    // Parse FormData schema into field definitions
    const parseFormDataSchema = useCallback((schema: SchemaObject | ReferenceObject | null | undefined): FormDataField[] => {
        if (!schema) return [];

        const resolved = resolveSchema(schema) as SchemaObject;
        if (!resolved || resolved.type !== 'object' || !resolved.properties) return [];

        const fields: FormDataField[] = [];
        const requiredFields = resolved.required || [];

        Object.entries(resolved.properties).forEach(([name, propSchema]) => {
            const resolvedProp = resolveSchema(propSchema) as SchemaObject;
            if (!resolvedProp) return;

            let fieldType: FormDataField['type'] = 'string';

            // Determine field type based on schema
            if (resolvedProp.type === 'string' && resolvedProp.format === 'binary') {
                fieldType = 'file';
            } else if (resolvedProp.type === 'array') {
                fieldType = 'array';
            } else if (resolvedProp.type === 'number') {
                fieldType = 'number';
            } else if (resolvedProp.type === 'integer') {
                fieldType = 'integer';
            } else if (resolvedProp.type === 'boolean') {
                fieldType = 'boolean';
            } else {
                fieldType = 'string';
            }

            const field: FormDataField = {
                name,
                type: fieldType,
                format: resolvedProp.format,
                required: requiredFields.includes(name),
                description: resolvedProp.description,
                example: resolvedProp.example,
                enum: resolvedProp.enum
            };

            // Handle array items
            if (fieldType === 'array' && resolvedProp.items) {
                const itemSchema = resolveSchema(resolvedProp.items) as SchemaObject;
                if (itemSchema) {
                    field.items = {
                        name: `${name}[]`,
                        type: itemSchema.type === 'string' && itemSchema.format === 'binary' ? 'file' :
                              itemSchema.type === 'number' ? 'number' :
                              itemSchema.type === 'integer' ? 'integer' :
                              itemSchema.type === 'boolean' ? 'boolean' : 'string',
                        format: itemSchema.format,
                        description: itemSchema.description,
                        example: itemSchema.example
                    };
                }
            }

            fields.push(field);
        });

        return fields;
    }, [resolveSchema]);

    // console.log("schema:", Object.entries());4
    const schm = Object.entries((resolveSchema(requestBodySchema) as SchemaObject)?.properties || {})
        .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});

    const generateInitialJson = useCallback((schema: SchemaObject | ReferenceObject | null | undefined, visited = new Set<string>()): unknown => {
        if (!schema) return null;

        const resolved = resolveSchema(schema) as SchemaObject;
        if (!resolved) return null;

        if (visited.has(JSON.stringify(resolved))) {
            // Return appropriate empty value based on type for circular references
            switch (resolved.type) {
                case 'string': return '';
                case 'number':
                case 'integer': return 0;
                case 'boolean': return false;
                case 'array': return [];
                case 'object': return {};
                default: return null;
            }
        }
        visited.add(JSON.stringify(resolved));

        if ((resolved as { allOf?: unknown[] }).allOf) {
            const combined = (resolved as { allOf: (SchemaObject | ReferenceObject)[] }).allOf.reduce((acc: Record<string, unknown>, subSchema) => {
                const generated = generateInitialJson(subSchema, visited);
                return {...acc, ...(typeof generated === 'object' && generated ? generated as Record<string, unknown> : {})};
            }, {});
            return combined;
        }

        if ((resolved as { oneOf?: unknown[], anyOf?: unknown[] }).oneOf || (resolved as { oneOf?: unknown[], anyOf?: unknown[] }).anyOf) {
            const subSchema = ((resolved as { oneOf?: (SchemaObject | ReferenceObject)[] }).oneOf || (resolved as { anyOf?: (SchemaObject | ReferenceObject)[] }).anyOf)?.[0];
            return generateInitialJson(subSchema, visited);
        }

        if (resolved.type === 'object') {
            const initialJson: { [key: string]: unknown } = {};
            for (const [key, prop] of Object.entries(resolved.properties || {})) {
                initialJson[key] = generateInitialJson(prop as SchemaObject, visited);
            }
            return initialJson;
        }

        if (resolved.type === 'array') {
            return [generateInitialJson(resolved.items as SchemaObject, visited)];
        }

        // Return appropriate empty values based on type
        if (resolved.example !== undefined) return resolved.example;
        if (resolved.default !== undefined) return resolved.default;
        
        switch (resolved.type) {
            case 'string':
                return '';
            case 'number':
            case 'integer':
                return 0;
            case 'boolean':
                return false;
            case 'array':
                return [];
            default:
                return null;
        }
    }, [resolveSchema]);

    useEffect(() => {
        if (requestBodySchema) {
            const initialJson = generateInitialJson(requestBodySchema);
            setRequestBody(JSON.stringify(initialJson, null, 2));
        }
    }, [requestBodySchema, generateInitialJson]);

    // Parse FormData fields when content type is multipart/form-data
    useEffect(() => {
        if (selectedContentType === "multipart/form-data" && requestBodySchema) {
            const fields = parseFormDataSchema(requestBodySchema);
            setFormDataFields(fields);

            // Initialize form values with defaults
            const initialValues: FormDataFieldValue = {};
            fields.forEach(field => {
                if (field.type === 'boolean') {
                    initialValues[field.name] = false;
                } else if (field.type === 'array') {
                    initialValues[field.name] = [];
                } else if (field.example !== undefined) {
                    initialValues[field.name] = field.example;
                } else {
                    initialValues[field.name] = '';
                }
            });
            setFormDataValues(initialValues);
        } else {
            setFormDataFields([]);
            setFormDataValues({});
        }
    }, [selectedContentType, requestBodySchema, parseFormDataSchema]);

    console.log("schema:2", resolveSchema(requestBodySchema));
    console.log("schema:2", schm);
    console.log("formDataFields:", formDataFields);


    // Construct URL with path parameter substitution
    const constructUrl = useCallback(() => {
        let fullUrl = `${selectedServer}${path.startsWith("/") ? path : `/${path}`}`;
        resolvedParameters
            .filter((p) => p.in === "path")
            .forEach((param) => {
                const value = parameters[param.name]?.toString();

                fullUrl = fullUrl.replace(`{${param.name}}`, encodeURIComponent(value || ""));
            });
        // Substitute server variables
        const foundServer = operation.servers?.find((s) => s.url === selectedServer);
        if (foundServer?.variables) {
            Object.entries(foundServer.variables).forEach(([name, variable]) => {
                fullUrl = fullUrl.replace(`{${name}}`, encodeURIComponent(variable.default));
            });
        }
        return fullUrl;
    }, [selectedServer, path, resolvedParameters, parameters, operation.servers]);

    // Generate cURL command
    const generateCurlCommand = useMemo(() => {
        const fullUrl = constructUrl();
        let curl = `curl -X ${method} "${fullUrl}"`;

        headers.forEach((header) => {
            if (header.name && header.value) {
                curl += ` \\\n  -H "${header.name}: ${header.value}"`;
            }
        });

        if (["POST", "PUT", "PATCH"].includes(method) && requestBody && requestBody.trim()) {
            if (selectedContentType === "application/json") {
                try {
                    const formattedBody = JSON.stringify(JSON.parse(requestBody));
                    curl += ` \\\n  -d '${formattedBody}'`;
                } catch {
                    curl += ` \\\n  -d '${requestBody}'`;
                }
            } else {
                curl += ` \\\n  -d '${requestBody}'`;
            }
        }

        return curl;
    }, [method, headers, requestBody, selectedContentType, constructUrl]);

    // Handle parameter change
    const handleParameterChange = (name: string, value: string) => {
        const param = resolvedParameters.find((p) => p.name === name);
        if (!param) return;
        setParameters((prev) => ({...prev, [name]: value}));
    };

    // Handle request body change
    const handleRequestBodyChange = (value: string) => {
        if (value.length > MAX_BODY_SIZE) {
            toast.error("Request body exceeds maximum size of 1MB.");
            return;
        }
        setRequestBody(value);
    };


    // Handle FormData field changes
    const handleFormDataFieldChange = (fieldName: string, value: string | number | boolean | File | File[]) => {
        setFormDataValues(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    // Handle array field changes (add/remove items)
    const handleArrayFieldAdd = (fieldName: string) => {
        setFormDataValues(prev => {
            const currentValue = prev[fieldName] as string[] || [];
            return {
                ...prev,
                [fieldName]: [...currentValue, '']
            };
        });
    };

    const handleArrayFieldRemove = (fieldName: string, index: number) => {
        setFormDataValues(prev => {
            const currentValue = prev[fieldName] as string[] || [];
            return {
                ...prev,
                [fieldName]: currentValue.filter((_, i) => i !== index)
            };
        });
    };

    const handleArrayFieldChange = (fieldName: string, index: number, value: string | File) => {
        setFormDataValues(prev => {
            const currentValue = prev[fieldName] as (string | File)[] || [];
            const newValue = [...currentValue];
            newValue[index] = value;
            return {
                ...prev,
                [fieldName]: newValue
            };
        });
    };

    // Format JSON
    const formatJson = () => {
        if (selectedContentType !== "application/json") return;
        try {
            const formatted = JSON.stringify(JSON.parse(requestBody), null, 2);
            setRequestBody(formatted);
            toast.success("JSON formatted successfully.");
        } catch {
            toast.error("Invalid JSON format.");
        }
    };


    // Copy to clipboard with security validation and icon feedback
    const copyToClipboard = async (text: string, type: 'url' | 'body' | 'curl') => {
        // Validate and sanitize clipboard content
        if (!text || typeof text !== 'string') {
            toast.error("Invalid content to copy");
            return;
        }

        // Limit clipboard content size to prevent DoS
        if (text.length > 50000) {
            toast.error("Content too large to copy");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);

            // Set the appropriate copied state based on type
            if (type === 'url') {
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
            } else if (type === 'body') {
                setCopiedBody(true);
                setTimeout(() => setCopiedBody(false), 2000);
            } else if (type === 'curl') {
                setCopiedCurl(true);
                setTimeout(() => setCopiedCurl(false), 2000);
            }

            toast.success("Copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy to clipboard");
        }
    };

    // Handle execute
    const handleExecute = async (data: { requestData: string }) => {
        startTransition(async () => {
            setResponse(null);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const formData = new FormData();
            formData.append("requestData", data.requestData);

            // Add FormData fields when using multipart/form-data
            if (selectedContentType === "multipart/form-data") {
                // Handle schema-based form fields
                Object.entries(formDataValues).forEach(([fieldName, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        if (Array.isArray(value)) {
                            // Handle arrays
                            value.forEach((item) => {
                                if (item instanceof File) {
                                    formData.append(fieldName, item);
                                } else if (item !== '') {
                                    formData.append(fieldName, String(item));
                                }
                            });
                        } else if (value instanceof File) {
                            formData.append(fieldName, value);
                        } else {
                            formData.append(fieldName, String(value));
                        }
                    }
                });

                // Note: Legacy single file upload support has been replaced with schema-based forms
            }
            try {
                const responseData = await executeApiRequest(formData);
                clearTimeout(timeoutId);
                setResponse(responseData);

                if (responseData.status >= 200 && responseData.status < 300) {
                    toast.success(`Request successful: ${responseData.status}`);
                } else if (responseData.status >= 400) {
                    toast.error(`Request failed: ${responseData.status}`);
                } else {
                    toast.info(`Request completed with status: ${responseData.status}`);
                }
            } catch (error) {
                console.error(error)
                clearTimeout(timeoutId);
                toast.error("Request failed.");
                setResponse({
                    status: 500,
                    body: JSON.stringify({error: "Request failed"}, null, 2),
                    headers: {"content-type": "application/json"},
                });
            }
        });
    };

    // Submit handler
    const onSubmit = handleSubmit(() => {
        const fullUrl = constructUrl();
        if (!isValidUrl(fullUrl)) {
            toast.error("Invalid URL.");
            return;
        }

        const requestData: ExecuteRequestForm = {
            method: method.toLowerCase(),
            path: fullUrl.replace(selectedServer, ""),
            baseUrl: selectedServer,
            parameters: {
                ...parameters,
                ...securityInputs
                    .filter(input => input.type === "query" && input.value)
                    .reduce((acc, input) => ({...acc, [input.name]: input.value}), {}),
            },
            requestBody: selectedContentType === "multipart/form-data" ? "" : requestBody,
            headers: [
                ...headers,
                ...securityInputs
                    .filter(input => input.type === "header" && input.value)
                    .map(input => ({name: input.name, value: input.value})),
            ],
        };

        handleExecute({requestData: JSON.stringify(requestData)});
    });

    // Render parameter inputs
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
                                    <label htmlFor={`param-${param.name}`}>
                                        {param.name} {param.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <Input
                                        id={`param-${param.name}`}
                                        value={parameters[param.name]?.toString() || ""}
                                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                        placeholder={param.example?.toString() || `Enter ${param.name}`}
                                    />
                                    {param.description && (
                                        <p className="text-xs text-muted-foreground">{param.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    };

    // Render security inputs
    const renderSecurityInputs = () => {
        if (securityInputs.length === 0) return null;
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-medium">Security Credentials</h3>
                {securityInputs.map((input) => (
                    <div key={input.name} className="space-y-2">
                        <label htmlFor={`security-${input.name}`}>{input.name}</label>
                        <Input
                            id={`security-${input.name}`}
                            placeholder={`Enter ${input.name}`}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSecurityInputs((prev) =>
                                    prev.map((i) =>
                                        i.name === input.name ? {...i, value} : i
                                    )
                                );
                                if (input.type === "header") {
                                    setHeaders((prev) => [
                                        ...prev.filter((h) => h.name !== input.name),
                                        {name: input.name, value},
                                    ]);
                                } else if (input.type === "query") {
                                    setParameters((prev) => ({...prev, [input.name]: value}));
                                }
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    };

    // Render FormData fields
    const renderFormDataFields = () => {
        if (formDataFields.length === 0) {
            return <div className="text-center py-6 text-muted-foreground">No form fields defined</div>;
        }

        return (
            <ScrollArea className="max-h-[500px]">
                <div className="space-y-4">
                    {formDataFields.map((field) => (
                        <div key={field.name} className="space-y-2">
                            <Label htmlFor={`formdata-${field.name}`} className="flex items-center gap-2">
                                {field.name}
                                {field.required && <span className="text-red-500">*</span>}
                                {field.description && (
                                    <span className="text-xs text-muted-foreground">({field.description})</span>
                                )}
                            </Label>

                            {field.type === 'boolean' ? (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`formdata-${field.name}`}
                                        checked={formDataValues[field.name] as boolean || false}
                                        onCheckedChange={(checked) =>
                                            handleFormDataFieldChange(field.name, checked as boolean)
                                        }
                                    />
                                    <Label htmlFor={`formdata-${field.name}`}>{field.name}</Label>
                                </div>
                            ) : field.type === 'file' ? (
                                <Input
                                    id={`formdata-${field.name}`}
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > MAX_BODY_SIZE) {
                                                toast.error("File exceeds maximum size of 1MB.");
                                                return;
                                            }
                                            handleFormDataFieldChange(field.name, file);
                                        }
                                    }}
                                />
                            ) : field.type === 'array' ? (
                                <div className="space-y-2">
                                    {(formDataValues[field.name] as (string | File)[] || []).map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {field.items?.type === 'file' ? (
                                                <Input
                                                    type="file"
                                                    className="flex-1"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (file.size > MAX_BODY_SIZE) {
                                                                toast.error("File exceeds maximum size of 1MB.");
                                                                return;
                                                            }
                                                            handleArrayFieldChange(field.name, index, file);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Input
                                                    type={field.items?.type === 'number' || field.items?.type === 'integer' ? 'number' : 'text'}
                                                    className="flex-1"
                                                    value={item as string}
                                                    onChange={(e) => handleArrayFieldChange(field.name, index, e.target.value)}
                                                    placeholder={field.items?.example?.toString() || `Enter ${field.name} item`}
                                                />
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleArrayFieldRemove(field.name, index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleArrayFieldAdd(field.name)}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add {field.name}
                                    </Button>
                                </div>
                            ) : field.enum ? (
                                <Select
                                    value={formDataValues[field.name] as string || ''}
                                    onValueChange={(value) => handleFormDataFieldChange(field.name, value)}
                                >
                                    <SelectTrigger id={`formdata-${field.name}`}>
                                        <SelectValue placeholder={`Select ${field.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.enum.map((option, index) => (
                                            <SelectItem key={index} value={String(option)}>
                                                {String(option)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id={`formdata-${field.name}`}
                                    type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
                                    value={formDataValues[field.name] as string || ''}
                                    onChange={(e) => {
                                        const value = field.type === 'number' || field.type === 'integer'
                                            ? Number(e.target.value)
                                            : e.target.value;
                                        handleFormDataFieldChange(field.name, value);
                                    }}
                                    placeholder={field.example?.toString() || `Enter ${field.name}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    };

    // Render body input
    const renderBodyInput = () => {
        if (!["POST", "PUT", "PATCH"].includes(method)) return null;
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Request Body</h3>
                    {requestBody && selectedContentType !== "multipart/form-data" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(requestBody, 'body')}
                            className="gap-2"
                        >
                            {copiedBody ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            Copy
                        </Button>
                    )}
                </div>
                {contentTypes.length > 1 && (
                    <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                        <SelectTrigger>
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {contentTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                {selectedContentType === "multipart/form-data" ? (
                    renderFormDataFields()
                ) : (
                    <Textarea
                        value={requestBody}
                        onChange={(e) => handleRequestBodyChange(e.target.value)}
                        placeholder="Enter request body"
                        className="font-mono min-h-[200px]"
                    />
                )}
            </div>
        );
    };

    // Render cURL input
    const renderCurlInput = () => (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">cURL Command</h3>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                {generateCurlCommand}
            </pre>
            <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateCurlCommand, 'curl')}
                className="gap-2"
            >
                {copiedCurl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
            </Button>
        </div>
    );

    return (
        <div className="h-full overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        {operation.servers && operation.servers.length > 0 && (
                            <Select value={selectedServer} onValueChange={setSelectedServer}>
                                <SelectTrigger className="w-48">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {operation.servers.map((server, index) => (
                                        <SelectItem key={index} value={server.url}>
                                            {server.description || server.url}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <div className="flex items-center gap-2 flex-1">
                            <span className="flex-1 border-input border rounded-md px-4 p-2 bg-muted font-mono text-sm">{constructUrl()}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(constructUrl(), 'url')}
                                className="gap-2"
                            >
                                {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList className="w-full">
                            <TabsTrigger value="body">Body</TabsTrigger>
                            <TabsTrigger value="params">Params</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>

                            <TabsTrigger value="curl">cURL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="params" className="mt-4">
                            {renderParameterInputs()}
                        </TabsContent>
                        <TabsContent value="security" className="mt-4">
                            {renderSecurityInputs()}
                        </TabsContent>

                        <TabsContent value="body" className="mt-4">
                            {renderBodyInput()}
                            <div className="flex items-center gap-2 mt-4">
                                {["POST", "PUT", "PATCH"].includes(method) && selectedContentType === "application/json" && (
                                    <Button onClick={formatJson} variant="outline">Format JSON</Button>
                                )}
                                <Button onClick={onSubmit} disabled={isPending} className="flex-1">
                                    {isPending ? <Loader2 className="animate-spin h-4 w-4"/> : "Send"}
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="curl" className="mt-4">
                            {renderCurlInput()}
                        </TabsContent>
                    </Tabs>

                    {response && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">Response</h3>
                                <span
                                    className={`px-2 py-1 rounded text-sm ${
                                        response.status >= 200 && response.status < 300
                                            ? "bg-green-100 text-green-800"
                                            : response.status >= 400
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                    }`}
                                >
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