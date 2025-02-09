export interface OpenApiDocument {
    openapi: string;
    info: InfoObject;
    paths: Record<string, PathItemObject>;
    components?: ComponentsObject;
    servers?: ServerObject[];
    tags?: TagObject[];
}

export interface InfoObject {
    title: string;
    description?: string;
    version: string;
    termsOfService?: string;
    contact?: ContactObject;
    license?: LicenseObject;
}

export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
}

export interface LicenseObject {
    name: string;
    identifier?: string;
    url?: string;
}

export interface PathItemObject {
    get?: OperationObject;
    post?: OperationObject;
    put?: OperationObject;
    delete?: OperationObject;
    patch?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    trace?: OperationObject;
    servers?: ServerObject[];
    parameters?: (ParameterObject | ReferenceObject)[];
}

export interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses: Record<string, ResponseObject | ReferenceObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
}

export interface ParameterObject {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    schema?: SchemaObject | ReferenceObject;
    style?: string;
    explode?: boolean;
}

export interface RequestBodyObject {
    description?: string;
    content: Record<string, MediaTypeObject>;
    required?: boolean;
}

export interface ResponseObject {
    description: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
}

export interface MediaTypeObject {
    schema?: SchemaObject | ReferenceObject;
    example?: unknown;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    encoding?: Record<string, EncodingObject>;
}

export interface SchemaObject {
    $ref?: string;
    type?: string;
    format?: string;
    properties?: Record<string, SchemaObject | ReferenceObject>;
    items?: SchemaObject | ReferenceObject;
    required?: string[];
    description?: string;
    enum?: unknown[];
    default?: unknown;
    nullable?: boolean;
}

export interface ReferenceObject {
    $ref: string;
}

export interface ComponentsObject {
    schemas?: Record<string, SchemaObject | ReferenceObject>;
    responses?: Record<string, ResponseObject | ReferenceObject>;
    parameters?: Record<string, ParameterObject | ReferenceObject>;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
}

export interface ServerObject {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariableObject>;
}

export interface TagObject {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}

export interface ExternalDocumentationObject {
    description?: string;
    url: string;
}

export interface SecurityRequirementObject {
    [name: string]: string[];
}

export interface HeaderObject {
    description?: string;
    required?: boolean;
    schema?: SchemaObject | ReferenceObject;
}

export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: Record<string, unknown>;
    requestBody?: unknown;
    description?: string;
    server?: ServerObject;
}

export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: unknown;
    externalValue?: string;
}

export interface EncodingObject {
    contentType?: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
}

export interface SecuritySchemeObject {
    type: 'apiKey' | 'http' | 'mutualTLS' | 'oauth2' | 'openIdConnect';
    description?: string;
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlowsObject;
    openIdConnectUrl?: string;
}

export interface ServerVariableObject {
    enum?: string[];
    default: string;
    description?: string;
}

export interface OAuthFlowsObject {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}