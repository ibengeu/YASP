import type {ParameterObject} from "@/common/openapi-spec.ts";

// Simple URL validation
function isURLSafe(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol) &&
               !parsedUrl.hostname.match(/^(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/);
    } catch {
        return false;
    }
}

// Safe fetch wrapper
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (!isURLSafe(url)) {
        throw new Error('URL is not safe for external requests');
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

export interface ResponseData {
    status: number;
    body: string;
    headers: Record<string, string>;
    time?: number;
}

export interface ExecuteRequestForm {
    method: string;
    path: string;
    baseUrl: string;
    parameters: {
        pathParams?: ParameterObject[];
        queryParams?: ParameterObject[];
        [key: string]: unknown;
    };
    requestBody: string;
    headers: Header[];
    formDataFields?: Record<string, string | string[] | File | File[]>;
}

export interface Header {
    name: string;
    value: string;
}

interface RequestConfig {
    url: URL;
    headers: Record<string, string>;
    method: string;
    body?: string | FormData;
}

/**
 * Validates and sanitizes string input
 */
function sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
        throw new Error("Invalid input type");
    }
    
    // Limit length to prevent DoS
    if (input.length > maxLength) {
        throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    // Remove null bytes and control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validates HTTP method
 */
function validateHttpMethod(method: string): boolean {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    return allowedMethods.includes(method.toUpperCase());
}

/**
 * Validates and parses form data into ExecuteRequestForm
 * @throws Error if request data is invalid
 */
function parseFormData(formData: FormData): ExecuteRequestForm & { formDataEntries: FormData } {
    const requestDataStr = formData.get("requestData");
    if (!requestDataStr || typeof requestDataStr !== "string") {
        throw new Error("Invalid request data");
    }

    // Limit JSON size to prevent DoS
    if (requestDataStr.length > 100000) { // 100KB limit
        throw new Error("Request data exceeds maximum size");
    }

    let parsed: ExecuteRequestForm;
    try {
        parsed = JSON.parse(requestDataStr) as ExecuteRequestForm;
    } catch {
        throw new Error("Invalid JSON format");
    }

    // Validate required fields
    if (!parsed.method || !parsed.baseUrl || !parsed.path) {
        throw new Error("Missing required fields");
    }

    // Validate HTTP method
    if (!validateHttpMethod(parsed.method)) {
        throw new Error("Invalid HTTP method");
    }

    // Sanitize string fields
    parsed.method = sanitizeString(parsed.method, 10);
    parsed.baseUrl = sanitizeString(parsed.baseUrl, 2000);
    parsed.path = sanitizeString(parsed.path, 2000);
    parsed.requestBody = sanitizeString(parsed.requestBody || '', 1000000); // 1MB limit

    // Validate headers
    if (parsed.headers) {
        parsed.headers = parsed.headers.map(header => ({
            name: sanitizeString(header.name, 100),
            value: sanitizeString(header.value, 1000)
        }));
    }

    // Extract and validate FormData fields (excluding requestData)
    const formDataFields: Record<string, string | string[] | File | File[]> = {};
    const processedKeys = new Set<string>();

    for (const [key, value] of formData.entries()) {
        if (key === 'requestData') continue; // Skip the main request data

        // Validate field name
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            continue; // Skip invalid field names
        }

        if (value instanceof File) {
            // Validate file size
            if (value.size > 10 * 1024 * 1024) { // 10MB limit per file
                throw new Error(`File ${key} exceeds maximum size of 10MB`);
            }

            // Handle multiple files with same name
            if (processedKeys.has(key)) {
                if (!Array.isArray(formDataFields[key])) {
                    formDataFields[key] = [formDataFields[key] as File];
                }
                (formDataFields[key] as File[]).push(value);
            } else {
                formDataFields[key] = value;
                processedKeys.add(key);
            }
        } else if (typeof value === 'string') {
            // Sanitize string values
            const sanitizedValue = sanitizeString(value, 10000);

            // Handle multiple values with same name
            if (processedKeys.has(key)) {
                if (!Array.isArray(formDataFields[key])) {
                    formDataFields[key] = [formDataFields[key] as string];
                }
                (formDataFields[key] as string[]).push(sanitizedValue);
            } else {
                formDataFields[key] = sanitizedValue;
                processedKeys.add(key);
            }
        }
    }

    parsed.formDataFields = formDataFields;

    return { ...parsed, formDataEntries: formData };
}

/**
 * Enhanced URL validation with comprehensive SSRF protection
 */
function validateUrl(url: URL): boolean {
    return isURLSafe(url.toString());
}

/**
 * Constructs the final URL with path and query parameters
 */
function buildUrl({path, baseUrl, parameters}: ExecuteRequestForm): URL {
    // Validate base URL first
    if (!isURLSafe(baseUrl)) {
        throw new Error("Base URL is not safe for external requests");
    }
    
    const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);
    
    // Handle path parameters with proper encoding
    if (parameters.pathParams) {
        const pathParams = parameters.pathParams.reduce((acc: Record<string, string>, param: ParameterObject) => {
            if (param.in === "path" && parameters[param.name]) {
                // Validate parameter value
                const value = String(parameters[param.name]);
                if (value.length > 1000) {
                    throw new Error(`Path parameter ${param.name} too long`);
                }
                acc[param.name] = value;
            }
            return acc;
        }, {});

        let finalPath = path;
        Object.entries(pathParams).forEach(([name, value]) => {
            // Sanitize and encode path parameter
            const sanitizedValue = value.replace(/[<>"'&]/g, '');
            finalPath = finalPath.replace(`{${name}}`, encodeURIComponent(sanitizedValue));
        });
        url.pathname = finalPath;
    }

    // Handle query parameters with validation
    if (parameters.queryParams) {
        const queryParams = new URLSearchParams();
        parameters.queryParams.forEach((param: ParameterObject) => {
            if (param.in === "query" && parameters[param.name]) {
                const value = String(parameters[param.name]);
                if (value.length > 2000) {
                    throw new Error(`Query parameter ${param.name} too long`);
                }
                // Sanitize query parameter
                const sanitizedValue = value.replace(/[<>"'&]/g, '');
                queryParams.append(param.name, sanitizedValue);
            }
        });
        url.search = queryParams.toString();
    }

    // Final URL safety check
    if (!validateUrl(url)) {
        throw new Error("Constructed URL is not safe for external requests");
    }

    return url;
}

/**
 * Builds and sanitizes headers object from header array
 */
function buildHeaders(headers: Header[]): Record<string, string> {
    const safeHeaders: Record<string, string> = {};
    const blockedHeaders = [
        'host', 'origin', 'referer', 'cookie', 'set-cookie',
        'x-forwarded-for', 'x-real-ip', 'x-forwarded-proto'
    ];
    
    headers.forEach(header => {
        if (!header.name || !header.value) return;
        
        const lowerName = header.name.toLowerCase();
        
        // Block dangerous headers
        if (blockedHeaders.includes(lowerName)) {
            return;
        }
        
        // Validate header name
        if (!/^[a-zA-Z0-9\-_]+$/.test(header.name)) {
            return;
        }
        
        // Sanitize header value
        const sanitizedValue = header.value
            .replace(/[\r\n]/g, '') // Remove CRLF injection
            .slice(0, 1000); // Limit length
            
        if (sanitizedValue) {
            safeHeaders[header.name] = sanitizedValue;
        }
    });
    
    return safeHeaders;
}

/**
 * Determines if request should include body based on method
 */
function shouldIncludeBody(method: string): boolean {
    return ["POST", "PUT", "PATCH"].includes(method.toUpperCase());
}

/**
 * Processes response body based on content type
 */
async function processResponseBody(response: Response): Promise<string> {
    try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            const json = await response.json();
            return JSON.stringify(json, null, 2);
        }
        return await response.text();
    } catch {
        return await response.text();
    }
}

/**
 * Converts response headers to object
 */
function parseResponseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        headers[key] = value;
    });
    return headers;
}

/**
 * Executes an API request with the provided form data
 * @returns ResponseData containing status, body, headers, and execution time
 */
export async function executeApiRequest(formData: FormData): Promise<ResponseData> {
    "use server";

    try {
        const data = parseFormData(formData);
        const url = buildUrl(data);
        const headers = buildHeaders(data.headers);

        const config: RequestConfig = {
            url,
            headers,
            method: data.method.toUpperCase(),
        };

        // Handle body based on content type
        if (shouldIncludeBody(data.method)) {
            if (data.formDataFields && Object.keys(data.formDataFields).length > 0) {
                // Build FormData body for multipart/form-data
                const formDataBody = new FormData();

                Object.entries(data.formDataFields).forEach(([fieldName, value]) => {
                    if (Array.isArray(value)) {
                        // Handle arrays - append multiple values with same name
                        value.forEach(item => {
                            if (item instanceof File) {
                                formDataBody.append(fieldName, item);
                            } else if (item !== '') {
                                formDataBody.append(fieldName, String(item));
                            }
                        });
                    } else if (value instanceof File) {
                        formDataBody.append(fieldName, value);
                    } else if (value !== undefined && value !== null && value !== '') {
                        formDataBody.append(fieldName, String(value));
                    }
                });

                config.body = formDataBody;
                // Remove Content-Type header to let browser set it with boundary
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            } else if (data.requestBody) {
                config.body = data.requestBody;
            }
        }

        // Basic request validation
        if (!config.url || !config.method) {
            throw new Error('Request validation failed: Missing URL or method');
        }

        const startTime = performance.now();
        
        // Use safeFetch with enhanced security
        const response = await safeFetch(config.url.toString(), {
            method: config.method,
            headers: {
                ...config.headers,
                'User-Agent': 'YASP-API-Tester/1.0',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/plain, */*',
                'Cache-Control': 'no-cache'
            },
            body: config.body
        });
        
        const endTime = performance.now();

        const body = await processResponseBody(response);
        const responseHeaders = parseResponseHeaders(response);

        return {
            status: response.status,
            body,
            headers: responseHeaders,
            time: Math.round(endTime - startTime),
        };
    } catch (error) {
        // Enhanced error logging and handling
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("API request error:", {
            message: errorMessage,
            timestamp: new Date().toISOString()
        });
        
        // Categorize and sanitize error messages
        let safeErrorMessage = "Request failed";
        let statusCode = 500;
        
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('rate limit')) {
                safeErrorMessage = "Rate limit exceeded. Please try again later.";
                statusCode = 429;
            } else if (message.includes('timeout') || message.includes('aborted')) {
                safeErrorMessage = "Request timeout. Please try again.";
                statusCode = 408;
            } else if (message.includes('network') || message.includes('fetch')) {
                safeErrorMessage = "Network error. Please check your connection.";
                statusCode = 503;
            } else if (message.includes('validation') || 
                       message.includes('invalid') ||
                       message.includes('unsafe') ||
                       message.includes('exceeds maximum') ||
                       message.includes('missing required')) {
                safeErrorMessage = error.message;
                statusCode = 400;
            } else if (message.includes('cors')) {
                safeErrorMessage = "CORS error. The API doesn't allow requests from this domain.";
                statusCode = 403;
            }
        }
        
        return {
            status: statusCode,
            body: JSON.stringify({error: safeErrorMessage, timestamp: new Date().toISOString()}, null, 2),
            headers: {"content-type": "application/json"},
            time: 0,
        };
    }
}