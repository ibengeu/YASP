/**
 * Shared types for API Detail Drawer components
 */

import type {ServerObject, PathItemObject} from '@/types/openapi-spec';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BodyContentType = 'json' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'none';

export interface ParsedOpenAPISpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: ServerObject[];
    paths?: Record<string, PathItemObject>;
    components?: any;
    security?: any[];
}

export interface ParamRow {
    enabled: boolean;
    key: string;
    value: string;
    description?: string;
    paramIn?: 'query' | 'path' | 'header' | 'cookie';
}

export interface HeaderRow {
    enabled: boolean;
    key: string;
    value: string;
}

export type AuthType = 'none' | 'api-key' | 'bearer' | 'basic';

export interface AuthConfig {
    type: AuthType;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
}

export interface TestRequest {
    method: HTTPMethod;
    url: string;
    params: ParamRow[];
    headers: HeaderRow[];
    auth: AuthConfig;
    body: string;
    bodyType: BodyContentType;
}

export interface TestResponse {
    status: number;
    statusText: string;
    time: number;
    size: number;
    headers: Record<string, string>;
    body: any;
}
