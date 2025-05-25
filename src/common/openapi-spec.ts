
// Utility types for OpenAPI 3.1.0
export type ReferenceObject = {
    $ref: string;
    summary?: string;
    description?: string;
};

export type SchemaObject =  {
    deprecated?: boolean;
    example?: any;
    examples?: any[];
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: {
        name?: string;
        namespace?: string;
        prefix?: string;
        attribute?: boolean;
        wrapped?: boolean;
    };
};

export type ParameterObject = {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: Record<string, any | ReferenceObject>;
};

export type MediaTypeObject = {
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: Record<string, any | ReferenceObject>;
    encoding?: Record<string, {
        contentType?: string;
        headers?: Record<string, HeaderObject | ReferenceObject>;
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
    }>;
};

export type RequestBodyObject = {
    description?: string;
    content: Record<string, MediaTypeObject>;
    required?: boolean;
};

export type HeaderObject = {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: Record<string, any | ReferenceObject>;
};

export type ResponseObject = {
    description: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
    links?: Record<string, any | ReferenceObject>;
};

export type OperationObject = {
    tags?: string[];
    summary?: string;
    description?: string;
    operationId?: string;
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses: Record<string, ResponseObject | ReferenceObject>;
    deprecated?: boolean;
    security?: Array<Record<string, string[]>>;
    servers?: Array<{
        url: string;
        description?: string;
        variables?: Record<string, {
            enum?: string[];
            default: string;
            description?: string;
        }>;
    }>;
};

export type PathItemObject = {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: OperationObject;
    put?: OperationObject;
    post?: OperationObject;
    delete?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    patch?: OperationObject;
    trace?: OperationObject;
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    parameters?: (ParameterObject | ReferenceObject)[];
};

export type ComponentsObject = {
    schemas?: Record<string, SchemaObject | ReferenceObject>;
    responses?: Record<string, ResponseObject | ReferenceObject>;
    parameters?: Record<string, ParameterObject | ReferenceObject>;
    requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    securitySchemes?: Record<string, {
        type: "apiKey" | "http" | "oauth2" | "openIdConnect";
        description?: string;
        name?: string;
        in?: "query" | "header" | "cookie";
        scheme?: string;
        bearerFormat?: string;
        flows?: {
            implicit?: {
                authorizationUrl: string;
                refreshUrl?: string;
                scopes: Record<string, string>;
            };
            password?: {
                tokenUrl: string;
                refreshUrl?: string;
                scopes: Record<string, string>;
            };
            clientCredentials?: {
                tokenUrl: string;
                refreshUrl?: string;
                scopes: Record<string, string>;
            };
            authorizationCode?: {
                authorizationUrl: string;
                tokenUrl: string;
                refreshUrl?: string;
                scopes: Record<string, string>;
            };
        };
        openIdConnectUrl?: string;
    } | ReferenceObject>;
};

export type OpenApiDocument = {
    openapi: string;
    info: {
        title: string;
        description?: string;
        termsOfService?: string;
        contact?: {
            name?: string;
            url?: string;
            email?: string;
        };
        license?: {
            name: string;
            url?: string;
        };
        version: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
        variables?: Record<string, {
            enum?: string[];
            default: string;
            description?: string;
        }>;
    }>;
    paths: Record<string, PathItemObject>;
    components?: ComponentsObject;
    security?: Array<Record<string, string[]>>;
    tags?: Array<{
        name: string;
        description?: string;
        externalDocs?: {
            description?: string;
            url: string;
        };
    }>;
    externalDocs?: {
        description?: string;
        url: string;
    };
};