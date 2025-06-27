/**
 * Validates and parses form data into ExecuteRequestForm
 * @throws Error if request data is invalid
 */
function parseFormData(formData) {
    const requestDataStr = formData.get("requestData");
    if (!requestDataStr || typeof requestDataStr !== "string") {
        throw new Error("Invalid request data");
    }
    return JSON.parse(requestDataStr);
}
/**
 * Constructs the final URL with path and query parameters
 */
function buildUrl({ path, baseUrl, parameters }) {
    const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);
    // Handle path parameters
    if (parameters.pathParams) {
        const pathParams = parameters.pathParams.reduce((acc, param) => {
            if (param.in === "path" && parameters[param.name]) {
                acc[param.name] = parameters[param.name];
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
        parameters.queryParams.forEach((param) => {
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
function buildHeaders(headers) {
    return headers.reduce((acc, header) => {
        if (header.name && header.value) {
            acc[header.name] = header.value;
        }
        return acc;
    }, {});
}
/**
 * Determines if request should include body based on method
 */
function shouldIncludeBody(method) {
    return ["POST", "PUT", "PATCH"].includes(method.toUpperCase());
}
/**
 * Processes response body based on content type
 */
async function processResponseBody(response) {
    try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            const json = await response.json();
            return JSON.stringify(json, null, 2);
        }
        return await response.text();
    }
    catch {
        return await response.text();
    }
}
/**
 * Converts response headers to object
 */
function parseResponseHeaders(response) {
    const headers = {};
    response.headers.forEach((value, key) => {
        headers[key] = value;
    });
    return headers;
}
/**
 * Executes an API request with the provided form data
 * @returns ResponseData containing status, body, headers, and execution time
 */
export async function executeApiRequest(formData) {
    "use server";
    try {
        const data = parseFormData(formData);
        const url = buildUrl(data);
        const headers = buildHeaders(data.headers);
        const config = {
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
            headers: config.headers,
            body: config.body,
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
    }
    catch (error) {
        console.error("Server error:", error);
        return {
            status: 500,
            body: JSON.stringify({ error: error instanceof Error ? error.message : "Server error" }, null, 2),
            headers: { "content-type": "application/json" },
            time: 0,
        };
    }
}
