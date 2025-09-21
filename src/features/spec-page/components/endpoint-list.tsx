import { OpenApiDocument, OperationObject } from '@/common/openapi-spec';
import { EndpointsList, EndpointInfo } from './endpoints-list';
import { groupEndpointsByTag } from '../lib/spec-utils';

interface EndpointListProps {
  spec: OpenApiDocument;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  selectedEndpoint: { path: string; method: string; operation: OperationObject } | null;
  setSelectedEndpoint: (endpoint: { path: string; method: string; operation: OperationObject } | null) => void;
}

export function EndpointList({
  spec,
  selectedTag,
  selectedEndpoint,
  setSelectedEndpoint
}: EndpointListProps) {
  // Group endpoints by tag
  const endpointsByTag = groupEndpointsByTag(spec);

  // Get endpoints for the selected tag, or all endpoints if no tag selected
  const endpoints: EndpointInfo[] = selectedTag
    ? (endpointsByTag[selectedTag] || [])
    : Object.values(endpointsByTag).flat();

  // Convert the selectedEndpoint to EndpointInfo format
  const selectedEndpointInfo: EndpointInfo | null = selectedEndpoint
    ? {
        path: selectedEndpoint.path,
        method: selectedEndpoint.method,
        operation: selectedEndpoint.operation,
        tag: selectedTag || undefined
      }
    : null;

  const handleEndpointSelect = (endpoint: EndpointInfo) => {
    setSelectedEndpoint({
      path: endpoint.path,
      method: endpoint.method,
      operation: endpoint.operation
    });
  };

  return (
    <EndpointsList
      endpoints={endpoints}
      selectedEndpoint={selectedEndpointInfo}
      onEndpointSelect={handleEndpointSelect}
    />
  );
}