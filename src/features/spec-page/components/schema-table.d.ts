import type { ComponentsObject, ReferenceObject, SchemaObject } from "../../../common/openapi-spec.ts";
export type SchemaTableProps = {
    schema: SchemaObject | ReferenceObject;
    components?: ComponentsObject;
};
export declare const SchemaTable: ({ schema, components }: SchemaTableProps) => import("react/jsx-runtime").JSX.Element | null;
