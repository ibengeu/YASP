import { OpenApiDocument } from "@/common/openapi-spec.ts";
interface SwaggerInputProps {
    onSpecLoaded: (spec: OpenApiDocument) => void;
}
export declare function SwaggerInput({ onSpecLoaded }: SwaggerInputProps): import("react/jsx-runtime").JSX.Element;
export {};
