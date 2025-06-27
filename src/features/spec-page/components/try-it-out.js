"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { executeApiRequest } from "@/features/spec-page/actions/execute-api-request.tsx";
import { ScrollArea } from "@/core/components/ui/scroll-area.tsx";
import { Input } from "@/core/components/ui/input.tsx";
import { Button } from "@/core/components/ui/button.tsx";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select.tsx";
import { Textarea } from "@/core/components/ui/textarea.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs.tsx";
export default function TryItOut({ path, method, operation, components }) {
    const [parameters, setParameters] = useState({});
    const [requestBody, setRequestBody] = useState("");
    const [headers, setHeaders] = useState([]);
    const [response, setResponse] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("params");
    const [newHeaderName, setNewHeaderName] = useState("");
    const [newHeaderValue, setNewHeaderValue] = useState("");
    const [selectedServer, setSelectedServer] = useState(operation.servers?.[0]?.url || "https://api.example.com");
    const [selectedMethod, setSelectedMethod] = useState(method.toUpperCase());
    const [selectedContentType, setSelectedContentType] = useState("");
    const [fileInput, setFileInput] = useState(null);
    const [securityInputs, setSecurityInputs] = useState([]);
    const { handleSubmit } = useForm({
        defaultValues: { requestData: "" },
    });
    const MAX_BODY_SIZE = 1024 * 1024; // 1MB
    const MAX_HEADER_SIZE = 1024; // 1KB
    const sanitizeInput = (input) => {
        return input.replace(/[<>]/g, "");
    };
    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    };
    // Filter parameters (no reference resolution)
    const resolvedParameters = useMemo(() => (operation.parameters || [])
        .filter((p) => !("$ref" in p)), [operation.parameters]);
    // Get requestBody (no reference resolution)
    const resolvedRequestBody = operation.requestBody && !("$ref" in operation.requestBody)
        ? operation.requestBody
        : undefined;
    const defaultHeaders = useMemo(() => {
        const headers = [];
        if (resolvedRequestBody?.content) {
            const contentType = Object.keys(resolvedRequestBody.content)[0] || "application/json";
            headers.push({ name: "Content-Type", value: contentType });
            setSelectedContentType(contentType);
        }
        headers.push({ name: "Accept", value: "*/*" });
        if (operation.responses) {
            Object.values(operation.responses).forEach((response) => {
                if (!("$ref" in response) && response.headers) {
                    Object.entries(response.headers).forEach(([name, header]) => {
                        if (!("$ref" in header) && header.example && !headers.some((h) => h.name === name)) {
                            headers.push({ name, value: header.example.toString() });
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
        const inputs = [];
        operation.security?.forEach((scheme) => {
            Object.keys(scheme).forEach((schemeName) => {
                const securityScheme = components.securitySchemes?.[schemeName];
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
    }, [operation.security, components]);
    useEffect(() => {
        setSecurityInputs(securityInputsInitial);
    }, [securityInputsInitial]);
    const requestBodySchema = useMemo(() => {
        if (!resolvedRequestBody?.content)
            return null;
        return resolvedRequestBody.content[selectedContentType]?.schema;
    }, [resolvedRequestBody, selectedContentType]);
    // Content types
    const contentTypes = useMemo(() => (resolvedRequestBody?.content ? Object.keys(resolvedRequestBody.content) : []), [resolvedRequestBody]);
    const resolveSchema = (currentSchema) => {
        if (currentSchema === undefined) {
            return currentSchema;
        }
        if ("$ref" in currentSchema && currentSchema.$ref?.startsWith("#/components/schemas/")) {
            const refKey = currentSchema.$ref.split("/").pop();
            const resolved = components?.schemas?.[refKey];
            if (resolved && "$ref" in resolved) {
                // Handle nested references
                return resolveSchema(resolved);
            }
            return resolved;
        }
        return currentSchema;
    };
    // console.log("schema:", Object.entries());4
    var schm = Object.entries(resolveSchema(requestBodySchema)?.properties || {})
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    console.log("schema:2", resolveSchema(requestBodySchema));
    console.log("schema:2", schm);
    // Initialize request body
    // useEffect(() => {
    //     if (["post", "put", "patch"].includes(method.toLowerCase()) && requestBodySchema) {
    //         if (selectedContentType === "application/json") {
    //             const sample = generateSampleFromSchema(requestBodySchema);
    //             try {
    //                 setRequestBody(JSON.stringify(sample || {}, null, 2));
    //             } catch {
    //                 setRequestBody("{}");
    //             }
    //         } else if (selectedContentType === "text/plain") {
    //             setRequestBody("example");
    //         }
    //     }
    // }, [method, requestBodySchema, selectedContentType]);
    // Construct URL with path parameter substitution
    const constructUrl = () => {
        let fullUrl = `${selectedServer}${path.startsWith("/") ? path : `/${path}`}`;
        resolvedParameters
            .filter((p) => p.in === "path")
            .forEach((param) => {
            const value = parameters[param.name]?.toString();
            if (param.required && !value) {
                toast.error(`Missing required path parameter: ${param.name}`);
            }
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
    };
    // Generate cURL command
    const generateCurlCommand = useMemo(() => {
        const fullUrl = constructUrl();
        let curl = `curl -X ${selectedMethod} "${fullUrl}"`;
        headers.forEach((header) => {
            if (header.name && header.value) {
                curl += ` \\\n  -H "${header.name}: ${header.value}"`;
            }
        });
        if (["POST", "PUT", "PATCH"].includes(selectedMethod) && requestBody && requestBody.trim()) {
            if (selectedContentType === "application/json") {
                try {
                    const formattedBody = JSON.stringify(JSON.parse(requestBody));
                    curl += ` \\\n  -d '${formattedBody}'`;
                }
                catch {
                    curl += ` \\\n  -d '${requestBody}'`;
                }
            }
            else {
                curl += ` \\\n  -d '${requestBody}'`;
            }
        }
        return curl;
    }, [selectedServer, path, selectedMethod, headers, requestBody, parameters, selectedContentType]);
    // Handle parameter change
    const handleParameterChange = (name, value) => {
        const param = resolvedParameters.find((p) => p.name === name);
        if (!param)
            return;
        setParameters((prev) => ({ ...prev, [name]: value }));
    };
    // Handle request body change
    const handleRequestBodyChange = (value) => {
        if (value.length > MAX_BODY_SIZE) {
            toast.error("Request body exceeds maximum size of 1MB.");
            return;
        }
        setRequestBody(value);
    };
    // Handle file upload for multipart/form-data
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_BODY_SIZE) {
                toast.error("File exceeds maximum size of 1MB.");
                return;
            }
            setFileInput(file);
        }
    };
    // Format JSON
    const formatJson = () => {
        if (selectedContentType !== "application/json")
            return;
        try {
            const formatted = JSON.stringify(JSON.parse(requestBody), null, 2);
            setRequestBody(formatted);
            toast.success("JSON formatted successfully.");
        }
        catch {
            toast.error("Invalid JSON format.");
        }
    };
    // Add header
    const addHeader = () => {
        if (!newHeaderName.trim())
            return;
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
    // Remove header
    const removeHeader = (index) => {
        setHeaders((prev) => prev.filter((_, i) => i !== index));
    };
    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
    };
    // Handle execute
    const handleExecute = async (data) => {
        startTransition(async () => {
            setResponse(null);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const formData = new FormData();
            formData.append("requestData", data.requestData);
            if (fileInput && selectedContentType === "multipart/form-data") {
                formData.append("file", fileInput);
            }
            try {
                const responseData = await executeApiRequest(formData);
                clearTimeout(timeoutId);
                const contentType = responseData.headers["content-type"]?.split(";")[0];
                let body = responseData.body;
                if (contentType === "application/json") {
                    body = JSON.stringify(JSON.parse(body), null, 2);
                }
                setResponse({ ...responseData, body });
                toast.success(`Request successful: ${responseData.status}`);
            }
            catch (error) {
                console.error(error);
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
    // Submit handler
    const onSubmit = handleSubmit(() => {
        const fullUrl = constructUrl();
        if (!isValidUrl(fullUrl)) {
            toast.error("Invalid URL.");
            return;
        }
        const requestData = {
            method: selectedMethod.toLowerCase(),
            path: fullUrl.replace(selectedServer, ""),
            baseUrl: selectedServer,
            parameters,
            requestBody: selectedContentType === "multipart/form-data" ? "" : requestBody,
            headers,
        };
        handleExecute({ requestData: JSON.stringify(requestData) });
    });
    // Render parameter inputs
    const renderParameterInputs = () => {
        if (resolvedParameters.length === 0) {
            return _jsx("div", { className: "text-center py-6 text-muted-foreground", children: "No parameters" });
        }
        const groupedParams = {};
        resolvedParameters.forEach((param) => {
            const paramIn = param.in || "query";
            if (!groupedParams[paramIn])
                groupedParams[paramIn] = [];
            groupedParams[paramIn].push(param);
        });
        return (_jsx(ScrollArea, { className: "max-h-[400px]", children: _jsx("div", { className: "space-y-6", children: Object.entries(groupedParams).map(([paramType, params]) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "text-sm font-semibold capitalize", children: [paramType, " Parameters"] }), params.map((param) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { htmlFor: `param-${param.name}`, children: [param.name, " ", param.required && _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: `param-${param.name}`, value: parameters[param.name]?.toString() || "", onChange: (e) => handleParameterChange(param.name, e.target.value), placeholder: param.example?.toString() || `Enter ${param.name}` }), param.description && (_jsx("p", { className: "text-xs text-muted-foreground", children: param.description }))] }, param.name)))] }, paramType))) }) }));
    };
    // Render security inputs
    const renderSecurityInputs = () => {
        if (securityInputs.length === 0)
            return null;
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Security Credentials" }), securityInputs.map((input) => (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: `security-${input.name}`, children: input.name }), _jsx(Input, { id: `security-${input.name}`, placeholder: `Enter ${input.name}`, onChange: (e) => {
                                const value = e.target.value;
                                setSecurityInputs((prev) => prev.map((i) => i.name === input.name ? { ...i, value } : i));
                                if (input.type === "header") {
                                    setHeaders((prev) => [
                                        ...prev.filter((h) => h.name !== input.name),
                                        { name: input.name, value },
                                    ]);
                                }
                                else if (input.type === "query") {
                                    setParameters((prev) => ({ ...prev, [input.name]: value }));
                                }
                            } })] }, input.name)))] }));
    };
    // Render headers input
    const renderHeadersInput = () => (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Headers" }), headers.map((header, index) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: header.name, onChange: (e) => {
                            const newHeaders = [...headers];
                            newHeaders[index].name = sanitizeInput(e.target.value);
                            setHeaders(newHeaders);
                        }, placeholder: "Header name" }), _jsx(Input, { value: header.value, onChange: (e) => {
                            const newHeaders = [...headers];
                            newHeaders[index].value = sanitizeInput(e.target.value);
                            setHeaders(newHeaders);
                        }, placeholder: "Value" }), _jsx(Button, { variant: "ghost", onClick: () => removeHeader(index), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, index))), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: newHeaderName, onChange: (e) => setNewHeaderName(e.target.value), placeholder: "Header name" }), _jsx(Input, { value: newHeaderValue, onChange: (e) => setNewHeaderValue(e.target.value), placeholder: "Value" }), _jsx(Button, { onClick: addHeader, disabled: !newHeaderName.trim(), children: _jsx(Plus, { className: "h-4 w-4" }) })] })] }));
    // Render body input
    const renderBodyInput = () => {
        if (!["POST", "PUT", "PATCH"].includes(selectedMethod))
            return null;
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Request Body" }), contentTypes.length > 1 && (_jsxs(Select, { value: selectedContentType, onValueChange: setSelectedContentType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: contentTypes.map((type) => (_jsx(SelectItem, { value: type, children: type }, type))) })] })), selectedContentType === "multipart/form-data" ? (_jsx(Input, { type: "file", onChange: handleFileUpload })) : (_jsx(Textarea, { value: requestBody, onChange: (e) => handleRequestBodyChange(e.target.value), placeholder: "Enter request body", className: "font-mono min-h-[200px]" })), selectedContentType === "application/json" && (_jsx(Button, { onClick: formatJson, children: "Format JSON" }))] }));
    };
    // Render cURL input
    const renderCurlInput = () => (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "cURL Command" }), _jsx("pre", { className: "bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap", children: generateCurlCommand }), _jsx(Button, { onClick: () => copyToClipboard(generateCurlCommand), children: "Copy" })] }));
    return (_jsx("div", { className: "h-full overflow-hidden", children: _jsx(ScrollArea, { className: "h-full", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsxs(Select, { value: selectedMethod, onValueChange: setSelectedMethod, children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "GET", children: "GET" }), _jsx(SelectItem, { value: "POST", children: "POST" }), _jsx(SelectItem, { value: "PUT", children: "PUT" }), _jsx(SelectItem, { value: "DELETE", children: "DELETE" }), _jsx(SelectItem, { value: "PATCH", children: "PATCH" })] })] }), operation.servers && operation.servers.length > 0 && (_jsxs(Select, { value: selectedServer, onValueChange: setSelectedServer, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: operation.servers.map((server, index) => (_jsx(SelectItem, { value: server.url, children: server.description || server.url }, index))) })] })), _jsx(Input, { value: constructUrl(), readOnly: true, className: "flex-1" }), _jsx(Button, { onClick: onSubmit, disabled: isPending, children: isPending ? _jsx(Loader2, { className: "animate-spin h-4 w-4" }) : "Send" })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "params", children: "Params" }), _jsx(TabsTrigger, { value: "security", children: "Security" }), _jsx(TabsTrigger, { value: "headers", children: "Headers" }), _jsx(TabsTrigger, { value: "body", children: "Body" }), _jsx(TabsTrigger, { value: "curl", children: "cURL" })] }), _jsx(TabsContent, { value: "params", className: "mt-4", children: renderParameterInputs() }), _jsx(TabsContent, { value: "security", className: "mt-4", children: renderSecurityInputs() }), _jsx(TabsContent, { value: "headers", className: "mt-4", children: renderHeadersInput() }), _jsx(TabsContent, { value: "body", className: "mt-4", children: renderBodyInput() }), _jsx(TabsContent, { value: "curl", className: "mt-4", children: renderCurlInput() })] }), response && (_jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Response" }), _jsx("span", { className: `px-2 py-1 rounded text-sm ${response.status >= 200 && response.status < 300
                                            ? "bg-green-100 text-green-800"
                                            : response.status >= 400
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"}`, children: response.status }), response.time && (_jsxs("span", { className: "text-sm text-muted-foreground", children: [response.time, "ms"] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium", children: "Headers" }), _jsx("pre", { className: "bg-muted p-3 rounded-md text-xs overflow-x-auto", children: JSON.stringify(response.headers, null, 2) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium", children: "Body" }), _jsx("pre", { className: "bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-96", children: response.body })] })] }))] }) }) }));
}
