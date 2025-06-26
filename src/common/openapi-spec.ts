/** JSON-compatible value per JSON Schema Draft 2020-12 for OAS 3.1.0. */
export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;

/** JSON array of JsonValue elements for OAS 3.1.0. */
export type JsonArray = JsonValue[];

/** JSON object with string keys and JsonValue values for OAS 3.1.0. */
export interface JsonObject {
    [key: string]: JsonValue
}

/** Link Object in OAS 3.1.0, defining a follow-up operation from a response. */
export interface LinkObject {
    /** URI to an OAS operation, mutually exclusive with operationId. */
    operationRef?: string;
    /** Unique operationId in OAS document, mutually exclusive with operationRef. */
    operationId?: string;
    /** Parameter names to values for the linked operation. */
    parameters?: Record<string, JsonValue>;
    /** Request body for the linked operation. */
    requestBody?: JsonValue;
    /** Description of the link, supports CommonMark. */
    description?: string;
    /** Target server for the linked operation. */
    server?: {
        /** Server URL, may include variables in {brackets}. Required. */
        url: string;
        /** Server description, supports CommonMark. */
        description?: string;
        /** Server variables for URL substitution. */
        variables?: Record<string, {
            /** Allowed values for the variable, non-empty if defined. */
            enum?: string[];
            /** Default value for substitution. Required. */
            default: string;
            /** Variable description, supports CommonMark. */
            description?: string;
        }>;
    };

    /** Specification extensions with "x-" prefix. */
    [key
    :
    `x-${string}`
        ]:
        JsonValue;
}
;

/** Reference Object in OAS 3.1.0 for internal/external component references. */
export interface ReferenceObject {
    /** URI to referenced component, e.g., '#/components/schemas/Pet'. Required. */
    $ref: string;
    /** Overrides referenced component's summary. */
    summary?: string;
    /** Overrides referenced component's description, supports CommonMark. */
    description?: string;
};

/** Schema Object in OAS 3.1.0, defines data types per JSON Schema Draft 2020-12. */
export interface SchemaObject {
    /** Marks schema as deprecated. Defaults to false. */
    deprecated?: boolean;
    /** Deprecated example of schema instance. Prefer 'examples'. */
    example?: JsonValue;
    /** Array of example values, overrides schema example. */
    examples?: JsonValue[];
    /** Property only in responses. Defaults to false. */
    readOnly?: boolean;
    /** Property only in requests. Defaults to false. */
    writeOnly?: boolean;
    /** XML representation metadata. */
    xml?: {
        /** Element/attribute name override. */
        name?: string;
        /** Namespace URI. */
        namespace?: string;
        /** Prefix for name. */
        prefix?: string;
        /** Property as attribute. Defaults to false. */
        attribute?: boolean;
        /** Wraps array. Defaults to false. */
        wrapped?: boolean;
    };
    /** Data type (e.g., string, number, array). */
    type?: string;
    /** Schema for array items. */
    items?: SchemaObject | ReferenceObject;
    /** Object properties. */
    properties?: Record<string, SchemaObject | ReferenceObject>;
    /** Required object properties. */
    required?: string[];
    /** Format for primitives (e.g., int32, date-time). */
    format?: string;
    /** Schema description, supports CommonMark. */
    description?: string;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Parameter Object in OAS 3.1.0, describes an operation parameter. */
export interface ParameterObject {
    /** Parameter name, case-sensitive. Required. */
    name: string;
    /** Parameter location. Required. */
    in: "query" | "header" | "path" | "cookie";
    /** Parameter description, supports CommonMark. */
    description?: string;
    /** Mandatory parameter, required for 'path'. Defaults to false. */
    required?: boolean;
    /** Marks parameter as deprecated. Defaults to false. */
    deprecated?: boolean;
    /** Allows empty query parameters. Defaults to false. */
    allowEmptyValue?: boolean;
    /** Serialization style. Defaults to form (query/cookie), simple (path/header). */
    style?: string;
    /** Explodes array/object parameters. Defaults to true for form. */
    explode?: boolean;
    /** Allows reserved characters in query. Defaults to false. */
    allowReserved?: boolean;
    /** Parameter type schema, mutually exclusive with 'content'. */
    schema?: SchemaObject | ReferenceObject;
    /** Parameter value example, mutually exclusive with 'examples'. */
    example?: JsonValue;
    /** Named examples, mutually exclusive with 'example'. */
    examples?: Record<string, JsonValue | ReferenceObject>;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Media Type Object in OAS 3.1.0, describes payload schema/examples. */
export interface MediaTypeObject {
    /** Content type schema. */
    schema?: SchemaObject | ReferenceObject;
    /** Content value example. */
    example?: JsonValue;
    /** Named examples for content. */
    examples?: Record<string, JsonValue | ReferenceObject>;
    /** Encoding definitions for properties. */
    encoding?: Record<string, {
        /** Property content type. */
        contentType?: string;
        /** Property headers. */
        headers?: Record<string, HeaderObject | ReferenceObject>;
        /** Property serialization style. */
        style?: string;
        /** Explode property values. */
        explode?: boolean;
        /** Allow reserved characters. */
        allowReserved?: boolean;
    }>;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Request Body Object in OAS 3.1.0, describes operation request body. */
export interface RequestBodyObject {
    /** Request body description, supports CommonMark. */
    description?: string;
    /** Content by media type. Required. */
    content: Record<string, MediaTypeObject>;
    /** Marks request body as required. Defaults to false. */
    required?: boolean;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Header Object in OAS 3.1.0, describes response header. */
export interface HeaderObject {
    /** Header description, supports CommonMark. */
    description?: string;
    /** Marks header as required. Defaults to false. */
    required?: boolean;
    /** Marks header as deprecated. Defaults to false. */
    deprecated?: boolean;
    /** Allows empty headers. Defaults to false. */
    allowEmptyValue?: boolean;
    /** Serialization style. Defaults to simple. */
    style?: string;
    /** Explodes array/object headers. Defaults to false. */
    explode?: boolean;
    /** Allows reserved characters. Defaults to false. */
    allowReserved?: boolean;
    /** Header type schema. */
    schema?: SchemaObject | ReferenceObject;
    /** Header value example, mutually exclusive with 'examples'. */
    example?: JsonValue;
    /** Named examples, mutually exclusive with 'example'. */
    examples?: Record<string, JsonValue | ReferenceObject>;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Response Object in OAS 3.1.0, describes an API operation response. */
export interface ResponseObject {
    /** Response description, supports CommonMark. Required. */
    description: string;
    /** Headers by name, case-insensitive. */
    headers?: Record<string, HeaderObject | ReferenceObject>;
    /** Media types and their content. */
    content?: Record<string, MediaTypeObject>;
    /** Links from the response. */
    links?: Record<string, LinkObject | ReferenceObject>;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Operation Object in OAS 3.1.0, describes a single API operation. */
export interface OperationObject {
    /** Tags for operation grouping. */
    tags?: string[];
    /** Operation summary. */
    summary?: string;
    /** Operation description, supports CommonMark. */
    description?: string;
    /** Unique operation identifier, case-sensitive. */
    operationId?: string;
    /** Operation parameters, no duplicates by name/location. */
    parameters?: (ParameterObject | ReferenceObject)[];
    /** Operation request body. */
    requestBody?: RequestBodyObject | ReferenceObject;
    /** Possible responses. Required. */
    responses: Record<string, ResponseObject | ReferenceObject>;
    /** Marks operation as deprecated. Defaults to false. */
    deprecated?: boolean;
    /** Operation-specific security mechanisms. */
    security?: Array<Record<string, string[]>>;
    /** Alternative servers for operation. */
    servers?: Array<{
        /** Server URL, may include variables in {brackets}. Required. */
        url: string;
        /** Server description, supports CommonMark. */
        description?: string;
        /** Server variables for URL substitution. */
        variables?: Record<string, {
            /** Allowed values, non-empty if defined. */
            enum?: string[];
            /** Default value for substitution. Required. */
            default: string;
            /** Variable description, supports CommonMark. */
            description?: string;
        }>;
    }>;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Path Item Object in OAS 3.1.0, describes operations on a path. */
export interface PathItemObject {
    /** Reference to another Path Item Object. */
    $ref?: string;
    /** Path summary for all operations. */
    summary?: string;
    /** Path description, supports CommonMark. */
    description?: string;
    /** GET operation. */
    get?: OperationObject;
    /** PUT operation. */
    put?: OperationObject;
    /** POST operation. */
    post?: OperationObject;
    /** DELETE operation. */
    delete?: OperationObject;
    /** OPTIONS operation. */
    options?: OperationObject;
    /** HEAD operation. */
    head?: OperationObject;
    /** PATCH operation. */
    patch?: OperationObject;
    /** TRACE operation. */
    trace?: OperationObject;
    /** Alternative servers for path operations. */
    servers?: Array<{
        /** Server URL, may include variables in {brackets}. Required. */
        url: string;
        /** Server description, supports CommonMark. */
        description?: string;
    }>;
    /** Parameters for all path operations, overridable. */
    parameters?: (ParameterObject | ReferenceObject)[];

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

/** Components Object in OAS 3.1.0, holds reusable objects. */
export interface ComponentsObject {
    /** Reusable schemas. */
    schemas?: Record<string, SchemaObject | ReferenceObject>;
    /** Reusable responses. */
    responses?: Record<string, ResponseObject | ReferenceObject>;
    /** Reusable parameters. */
    parameters?: Record<string, ParameterObject | ReferenceObject>;
    /** Reusable request bodies. */
    requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
    /** Reusable headers. */
    headers?: Record<string, HeaderObject | ReferenceObject>;
    /** Reusable security schemes. */
    securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};

export type SecuritySchemeObject =
    | {
    type: "apiKey";
    name: string; // Required for apiKey
    in: "query" | "header" | "cookie"; // Required for apiKey
    description?: string;
}
    | {
    type: "http";
    scheme: string; // Required for http
    bearerFormat?: string;
    description?: string;
}
    | {
    type: "oauth2";
    flows: {
        // At least one flow must be defined
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
    }; // Required for oauth2
    description?: string;
}
    | {
    type: "openIdConnect";
    openIdConnectUrl: string; // Required for openIdConnect
    description?: string;
}
    | {
    type: "mutualTLS";
    description?: string;
};

/** OpenAPI Document in OAS 3.1.0, defines API structure/metadata. */
export interface OpenApiDocument {
    /** OAS version, e.g., '3.1.0'. Required. */
    openapi: string;
    /** API metadata. Required. */
    info: {
        /** API title. Required. */
        title: string;
        /** API description, supports CommonMark. */
        description?: string;
        /** Terms of Service URL. */
        termsOfService?: string;
        /** Contact information. */
        contact?: {
            /** Contact name. */
            name?: string;
            /** Contact URL. */
            url?: string;
            /** Contact email. */
            email?: string;
        };
        /** License information. */
        license?: {
            /** License name. Required. */
            name: string;
            /** License URL, mutually exclusive with identifier. */
            url?: string;
            /** SPDX license expression, mutually exclusive with url. */
            identifier?: string;
        };
        /** Document version. Required. */
        version: string;
    };
    /** Server connectivity, defaults to '/'. */
    servers?: Array<{
        /** Server URL, may include variables in {brackets}. Required. */
        url: string;
        /** Server description, supports CommonMark. */
        description?: string;
        /** Server variables for URL substitution. */
        variables?: Record<string, {
            /** Allowed values, non-empty if defined. */
            enum?: string[];
            /** Default value for substitution. Required. */
            default: string;
            /** Variable description, supports CommonMark. */
            description?: string;
        }>;
    }>;
    /** Paths and operations. Required unless components/webhooks defined. */
    paths: Record<string, PathItemObject>;
    /** Reusable components. */
    components?: ComponentsObject;
    /** Global security mechanisms. */
    security?: Array<Record<string, string[]>>;
    /** Tags for logical grouping. */
    tags?: Array<{
        /** Tag name. Required. */
        name: string;
        /** Tag description, supports CommonMark. */
        description?: string;
        /** External documentation. */
        externalDocs?: {
            /** Documentation description, supports CommonMark. */
            description?: string;
            /** Documentation URL. Required. */
            url: string;
        };
    }>;
    /** External API documentation. */
    externalDocs?: {
        /** Documentation description, supports CommonMark. */
        description?: string;
        /** Documentation URL. Required. */
        url: string;
    };

    /** Specification extensions with "x-" prefix. */
    [key: `x-${string}`]: JsonValue;
};