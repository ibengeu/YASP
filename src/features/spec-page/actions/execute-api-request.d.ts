import type { ParameterObject } from "@/common/openapi-spec.ts";
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
/**
 * Executes an API request with the provided form data
 * @returns ResponseData containing status, body, headers, and execution time
 */
export declare function executeApiRequest(formData: FormData): Promise<ResponseData>;
