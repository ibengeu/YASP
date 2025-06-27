import React from "react";
import { ComponentsObject, OperationObject } from "../../../common/openapi-spec.ts";
interface EndpointDetailProps {
    path: string;
    method: string;
    operation: OperationObject;
    components: ComponentsObject;
}
export declare const EndpointDetail: React.FC<EndpointDetailProps>;
export {};
