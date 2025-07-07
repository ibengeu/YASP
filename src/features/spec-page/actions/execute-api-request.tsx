import type {ParameterObject} from "@/common/openapi-spec.ts";

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
 * Validates if a URL is safe for SSRF prevention
 */
function validateUrl(url: URL): boolean {
    // Block dangerous protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(url.protocol)) {
        return false;
    }
    
    // Block URLs with credentials
    if (url.username || url.password) {
        return false;
    }
    
    // Block non-standard ports that might be used for internal services
    const dangerousPorts = [22, 23, 25, 53, 80, 110, 143, 993, 995, 1433, 1521, 3306, 5432, 6379, 9200, 27017];
    if (url.port && dangerousPorts.includes(parseInt(url.port))) {
        // Allow standard web ports
        if (!['80', '443', '8080', '8443'].includes(url.port)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Constructs the final URL with path and query parameters
 */
function buildUrl({path, baseUrl, parameters}: ExecuteRequestForm): URL {
    const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);
    
    // Validate URL for SSRF prevention
    if (!validateUrl(url)) {
        throw new Error("Invalid or unsafe URL detected");
    }

    // Handle path parameters
    if (parameters.pathParams) {
        const pathParams = parameters.pathParams.reduce((acc: Record<string, string>, param: ParameterObject) => {
            if (param.in === "path" && parameters[param.name]) {
                acc[param.name] = parameters[param.name] as string;
            }
            return acc;
        }, {});

        let finalPath = path;
        Object.entries(pathParams).forEach(([name, value]) => {
            finalPath = finalPath.replace(`{${name}}`, encodeURIComponent(String(value)));
        });
        url.pathname = finalPath;
    }

    // Handle query parameters
    if (parameters.queryParams) {
        const queryParams = new URLSearchParams();
        parameters.queryParams.forEach((param: ParameterObject) => {
            if (param.in === "query" && parameters[param.name]) {
                queryParams.append(param.name, String(parameters[param.name]));
            }
        });
        url.search = queryParams.toString();
    }

    return url;
}

/**
 * Builds headers object from header array
 */
function buildHeaders(headers: Header[]): Record<string, string> {
    return headers.reduce((acc: Record<string, string>, header) => {
        if (header.name && header.value) {
            acc[header.name] = header.value;
        }
        return acc;
    }, {});
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

        const startTime = performance.now();
        const response = await fetch(config.url.toString(), {
            method: config.method,
            headers: {
                ...config.headers,
                // Add security headers
                'User-Agent': 'OpenAPI-Tester/1.0',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: config.body,
            // Security options
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            mode: 'cors'
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
        // Log error for debugging but don't expose sensitive information
        console.error("Server error:", error instanceof Error ? error.message : "Unknown error");
        
        // Return generic error message to prevent information disclosure
        let errorMessage = "Request failed";
        let statusCode = 500;
        
        if (error instanceof Error) {
            // Only expose safe error messages
            if (error.message.includes("Invalid") || 
                error.message.includes("exceeds maximum") ||
                error.message.includes("Missing required") ||
                error.message.includes("unsafe URL")) {
                errorMessage = error.message;
                statusCode = 400;
            }
        }
        
        return {
            status: statusCode,
            body: JSON.stringify({error: errorMessage}, null, 2),
            headers: {"content-type": "application/json"},
            time: 0,
        };
    }
}