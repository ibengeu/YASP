import { ComponentsObject, OperationObject } from "@/common/openapi-spec";
interface TryItOutProps {
    path: string;
    method: string;
    operation: OperationObject;
    components: ComponentsObject;
}
export default function TryItOut({ path, method, operation, components }: TryItOutProps): import("react/jsx-runtime").JSX.Element;
export {};
