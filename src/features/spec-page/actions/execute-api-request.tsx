import type {ParameterObject} from "@/common/openapi-spec.ts";
import { safeFetch, isURLSafe } from "@/core/security/ssrf-protection.ts";
import { APIRequestSchema } from "@/core/validation/schemas.ts";

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
}

export interface Header {
    name: string;
    value: string;
}

interface RequestConfig {
    url: URL;
    headers: Record<string, string>;
    method: string;
    body?: string;
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
function parseFormData(formData: FormData): ExecuteRequestForm {
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
    
    return parsed;
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

        if (shouldIncludeBody(data.method) && data.requestBody) {
            config.body = data.requestBody;
        }

        // Validate complete request
        const requestValidation = APIRequestSchema.safeParse({
            method: config.method,
            url: config.url.toString(),
            headers: config.headers,
            body: config.body || '',
            timeout: 10000
        });
        
        if (!requestValidation.success) {
            throw new Error(`Request validation failed: ${requestValidation.error.errors[0]?.message}`);
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
        }, 'api-test-user');
        
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
            url: data?.baseUrl,
            method: data?.method,
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