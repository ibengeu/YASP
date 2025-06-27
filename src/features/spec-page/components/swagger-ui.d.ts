import { OpenApiDocument, OperationObject } from "@/common/openapi-spec.ts";
interface SwaggerUIProps {
    spec: OpenApiDocument;
    onEndpointSelected?: (endpoint: {
        path: string;
        method: string;
        operation: OperationObject;
    } | null) => void;
}
export declare function SwaggerUI({ spec, onEndpointSelected }: SwaggerUIProps): import("react/jsx-runtime").JSX.Element;
export {};
