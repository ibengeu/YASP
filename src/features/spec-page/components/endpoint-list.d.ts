import React from "react";
import type { OpenApiDocument, OperationObject } from "../../../common/openapi-spec.ts";
interface EndpointListProps {
    spec: OpenApiDocument;
    selectedTag: string | null;
    setSelectedTag: (tag: string) => void;
    selectedEndpoint: {
        path: string;
        method: string;
    } | null;
    setSelectedEndpoint: (endpoint: {
        path: string;
        method: string;
        operation: OperationObject;
    }) => void;
}
export interface EndpointEntry {
    path: string;
    method: string;
    operation: OperationObject;
}
export declare const EndpointList: React.FC<EndpointListProps>;
export {};
