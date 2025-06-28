import {OpenApiDocument, PathItemObject} from "@/common/openapi-spec";
import {EndpointEntry} from "@/features/spec-page/components/endpoint-list";

/**
 * Groups API endpoints by their tags from an OpenAPI specification.
 * Endpoints without tags are grouped under "untagged".
 *
 * @param spec The OpenAPI document.
 * @returns A record where keys are tags and values are arrays of endpoints.
 */
export function groupEndpointsByTag(spec: OpenApiDocument): Record<string, EndpointEntry[]> {
    const pathsByTag = Object.entries(spec.paths).reduce<Record<string, EndpointEntry[]>>(
        (acc, [path, pathItem]) => {
            if (!pathItem) return acc;

            const validMethods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"] as const;
            validMethods.forEach((method) => {
                const operation = (pathItem as PathItemObject)[method];
                if (!operation) return;

                const tags = operation.tags?.length ? operation.tags : ["untagged"];
                tags.forEach((tag: string) => {
                    if (!acc[tag]) acc[tag] = [];
                    acc[tag].push({path, method, operation});
                });
            });
            return acc;
        },
        {}
    );
    return pathsByTag;
}
