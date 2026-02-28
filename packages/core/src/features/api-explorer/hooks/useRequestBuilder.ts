/**
 * useRequestBuilder
 *
 * Derives TestRequest state from a selected endpoint + server URL, and exposes
 * request mutation helpers. Extracted from ApiDetailDrawer and WorkbenchView
 * where this logic was duplicated verbatim.
 *
 * Security: OWASP A07:2025 – Injection: encodeURIComponent is applied at
 * send-time (in the calling component), not here; this hook only builds the
 * request shape from the spec schema.
 */

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_HEADERS } from '@/lib/constants';
import {
  generateExampleFromSchema,
  resolveRef,
  detectBodyTypeFromSpec,
  bodyTypeToContentType,
  extractFormFields,
} from '@/components/api-details/utils';
import type {
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from '@/types/openapi-spec';
import type {
  HTTPMethod,
  ParsedOpenAPISpec,
  ParamRow,
  HeaderRow,
  TestRequest,
  BodyContentType,
} from '@/components/api-details/types';

export interface SelectedEndpoint {
  path: string;
  method: string;
  operation: OperationObject;
}

export interface RequestBuilderState {
  request: TestRequest;
  setRequest: React.Dispatch<React.SetStateAction<TestRequest>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  handleBodyTypeChange: (newType: BodyContentType) => void;
}

export function useRequestBuilder(
  selectedEndpoint: SelectedEndpoint | null,
  selectedServer: string,
  spec: ParsedOpenAPISpec | null,
): RequestBuilderState {
  const [request, setRequest] = useState<TestRequest>(() => ({
    method: 'GET',
    url: '',
    params: [],
    headers: [...DEFAULT_HEADERS.map((h) => ({ ...h })), { enabled: false, key: '', value: '' }],
    auth: { type: 'none' },
    body: '{\n  \n}',
    bodyType: 'json',
  }));
  const [activeTab, setActiveTab] = useState<string>('params');

  useEffect(() => {
    if (!selectedEndpoint || !spec) return;

    const fullUrl = `${selectedServer}${selectedEndpoint.path}`;

    // Merge path-level and operation-level params, operation takes precedence
    const pathLevelParams = (spec?.paths?.[selectedEndpoint.path]?.parameters ?? []) as (ParameterObject | ReferenceObject)[];
    const operationParams = (selectedEndpoint.operation?.parameters ?? []) as (ParameterObject | ReferenceObject)[];

    const paramMap = new Map<string, ParameterObject | ReferenceObject>();
    for (const p of pathLevelParams) paramMap.set(`${(p as ParameterObject).name}:${(p as ParameterObject).in}`, p);
    for (const p of operationParams) paramMap.set(`${(p as ParameterObject).name}:${(p as ParameterObject).in}`, p);

    const paramRows: ParamRow[] = [];
    const headerParamsFromSpec: HeaderRow[] = [];

    for (const paramOrRef of paramMap.values()) {
      const param = paramOrRef as ParameterObject;
      const location = param.in as string;
      if (location === 'header') {
        headerParamsFromSpec.push({
          enabled: param.required || true,
          key: param.name,
          value: (param.schema as SchemaObject)?.default ?? '',
        });
      } else if (location === 'query' || location === 'path' || location === 'cookie') {
        paramRows.push({
          enabled: location === 'path' ? true : (param.required ?? false),
          key: param.name,
          value: (param.schema as SchemaObject)?.default?.toString() ?? '',
          description: param.description,
          paramIn: location as ParamRow['paramIn'],
        });
      }
    }
    paramRows.push({ enabled: false, key: '', value: '', description: undefined });

    // Build example body
    let exampleBody = '{\n  \n}';
    if (selectedEndpoint.operation?.requestBody) {
      let requestBody = selectedEndpoint.operation.requestBody;
      if ((requestBody as ReferenceObject).$ref && spec) {
        requestBody = (resolveRef((requestBody as ReferenceObject).$ref, spec) as RequestBodyObject) ?? requestBody;
      }
      const rb = requestBody as RequestBodyObject;
      const content = rb.content ?? {};
      const jsonContent = content['application/json'];
      const formContent = content['application/x-www-form-urlencoded'];
      const textContent = content['text/plain'];
      const firstContentType = Object.keys(content)[0];

      if (jsonContent) {
        if (jsonContent.schema) exampleBody = generateExampleFromSchema(jsonContent.schema, 0, spec);
        else if (jsonContent.example) exampleBody = JSON.stringify(jsonContent.example, null, 2);
      } else if (formContent) {
        if (formContent.schema && (formContent.schema as SchemaObject).properties) {
          const params = Object.keys((formContent.schema as SchemaObject).properties!)
            .map((key) => `${key}=value`)
            .join('&');
          exampleBody = params || 'key=value';
        } else exampleBody = 'key=value&key2=value2';
      } else if (textContent) {
        exampleBody = textContent.example ?? 'Plain text content';
      } else if (firstContentType && content[firstContentType]?.example) {
        const ex = content[firstContentType].example;
        exampleBody = typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2);
      }
    } else if (selectedEndpoint.operation?.parameters) {
      // Swagger 2.0 body parameter
      const bodyParam = (selectedEndpoint.operation.parameters as (ParameterObject | ReferenceObject)[])
        .find((p) => (p as ParameterObject).in === ('body' as unknown)) as ParameterObject;
      if (bodyParam?.schema) {
        exampleBody = generateExampleFromSchema(bodyParam.schema, 0, spec);
      } else if (bodyParam?.example) {
        exampleBody = typeof bodyParam.example === 'string'
          ? bodyParam.example
          : JSON.stringify(bodyParam.example, null, 2);
      }
    }

    const detectedBodyType = detectBodyTypeFromSpec(selectedEndpoint.operation, spec);
    const bodyFields = extractFormFields(selectedEndpoint, spec);

    const mergedHeaders = [
      ...DEFAULT_HEADERS.map((h) => ({ ...h })),
      ...headerParamsFromSpec,
      { enabled: false, key: '', value: '' },
    ];

    const contentTypeValue = bodyTypeToContentType(detectedBodyType);
    if (contentTypeValue) {
      const ctIndex = mergedHeaders.findIndex((h) => h.key.toLowerCase() === 'content-type');
      if (ctIndex >= 0) mergedHeaders[ctIndex] = { ...mergedHeaders[ctIndex], value: contentTypeValue };
    }

    setRequest((prev) => ({
      ...prev,
      method: selectedEndpoint.method.toUpperCase() as HTTPMethod,
      url: fullUrl,
      params: paramRows,
      headers: mergedHeaders,
      body: exampleBody,
      bodyFields,
      bodyType: detectedBodyType,
    }));

    setActiveTab(['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method.toUpperCase()) ? 'body' : 'params');
  }, [selectedEndpoint, selectedServer, spec]);

  const handleBodyTypeChange = useCallback((newType: BodyContentType) => {
    const contentTypeValue = bodyTypeToContentType(newType);
    setRequest((prev) => ({
      ...prev,
      bodyType: newType,
      headers: prev.headers.map((h) =>
        h.key.toLowerCase() === 'content-type'
          ? { ...h, value: contentTypeValue, enabled: contentTypeValue !== '' }
          : h,
      ),
    }));
  }, []);

  return { request, setRequest, activeTab, setActiveTab, handleBodyTypeChange };
}
