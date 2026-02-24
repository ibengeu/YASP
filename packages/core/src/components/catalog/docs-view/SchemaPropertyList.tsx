/**
 * SchemaPropertyList — Recursive schema renderer for OpenAPI docs viewer
 * Handles: $ref, allOf (merge), anyOf/oneOf (first variant), object properties, arrays
 *
 * Mitigation for OWASP A04:2025 – Insecure Design: Schema values rendered via React JSX
 * (escaped by default), never via innerHTML. Depth capped at 4 to prevent DoS via deeply
 * nested recursive schemas.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { resolveInlineRef } from './utils';
import type { ParsedOpenAPISpec as ApiDetailsParsedSpec } from '@/components/api-details/types';
import type { ParsedOpenAPISpec, SchemaEntry } from './types';
import type { SchemaObject, ReferenceObject } from '@/types/openapi-spec';

const MAX_DEPTH = 4;

interface ExtendedSchema extends SchemaObject {
  allOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];
  /** Set by resolveSchema when anyOf/oneOf contains a null variant */
  _nullable?: boolean;
  /** Set by resolveSchema when a $ref cannot be resolved — carries the ref string */
  _unresolvedRef?: string;
}

interface SchemaPropertyListProps {
  schema: SchemaObject | ReferenceObject;
  spec: ParsedOpenAPISpec;
  requiredFields?: string[];
  depth?: number;
}

/**
 * Resolve a schema, following $ref, allOf, anyOf, oneOf to a concrete SchemaObject.
 *
 * allOf — deep-merges all sub-schema properties and required arrays.
 * anyOf/oneOf — picks the first non-null variant; attaches _nullable=true if a
 *   null variant is present; lists all non-null types as _variants when > 1.
 * dangling $ref — returns a marker object with _unresolvedRef set.
 *
 * Mitigation for OWASP A04:2025 – Insecure Design: resolveInlineRef only follows
 * '#/' local refs, preventing resolution of external or malicious references.
 */
function resolveSchema(
  schema: SchemaObject | ReferenceObject,
  spec: ParsedOpenAPISpec
): ExtendedSchema {
  // Resolve $ref
  if ('$ref' in schema) {
    const ref = (schema as ReferenceObject).$ref;
    const resolved = resolveInlineRef(ref, spec as unknown as ApiDetailsParsedSpec);
    if (resolved && typeof resolved === 'object') {
      return resolveSchema(resolved as SchemaObject | ReferenceObject, spec);
    }
    // Dangling ref — return marker so UI can display an unresolved indicator
    const refName = ref.split('/').pop() ?? ref;
    return { _unresolvedRef: refName } as ExtendedSchema;
  }

  const s = schema as ExtendedSchema;

  // Merge allOf variants — deep-merge properties and required separately from
  // Object.assign so earlier properties are never overwritten by later sub-schemas.
  if (s.allOf && s.allOf.length > 0) {
    const merged: ExtendedSchema = {};
    for (const sub of s.allOf) {
      const resolved = resolveSchema(sub, spec);
      // Copy scalar fields (type, description, format, …) without clobbering
      // already-merged properties/required arrays
      const { properties: _p, required: _r, ...rest } = resolved;
      Object.assign(merged, rest);
      // Deep-merge properties
      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties };
      }
      // Accumulate required without duplication
      if (resolved.required) {
        const existing = new Set(merged.required ?? []);
        resolved.required.forEach((f) => existing.add(f));
        merged.required = Array.from(existing);
      }
    }
    return merged;
  }

  // anyOf / oneOf — surface all non-null variants; flag nullable if null present.
  const variants = s.anyOf ?? s.oneOf;
  if (variants && variants.length > 0) {
    const isNull = (v: SchemaObject | ReferenceObject) =>
      !('$ref' in v) && (v as SchemaObject).type === 'null';

    const hasNull = variants.some(isNull);
    const nonNull = variants.filter((v) => !isNull(v));

    if (nonNull.length === 0) {
      // All variants are null — edge case, just return null type
      return { type: 'null' } as ExtendedSchema;
    }

    // Resolve the first non-null variant as the primary schema
    const primary = resolveSchema(nonNull[0], spec);

    if (hasNull) {
      primary._nullable = true;
    }

    // When there are multiple non-null variants, attach their type labels
    if (nonNull.length > 1) {
      (primary as any)._variantTypes = nonNull.map((v) => {
        if ('$ref' in v) return (v as ReferenceObject).$ref.split('/').pop() ?? '$ref';
        return (v as SchemaObject).type ?? 'object';
      });
    }

    return primary;
  }

  return s;
}

/** Small chips showing schema constraints */
function ConstraintBadges({ schema }: { schema: SchemaObject }) {
  const badges: React.ReactNode[] = [];

  if (schema.format) {
    badges.push(
      <code key="format" className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
        {schema.format}
      </code>
    );
  }
  if (schema.pattern) {
    badges.push(
      <code key="pattern" className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono truncate max-w-[12rem]" title={schema.pattern}>
        /{schema.pattern}/
      </code>
    );
  }
  if (schema.minimum !== undefined) {
    badges.push(
      <code key="min" className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
        min: {schema.minimum}
      </code>
    );
  }
  if (schema.maximum !== undefined) {
    badges.push(
      <code key="max" className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
        max: {schema.maximum}
      </code>
    );
  }
  if (schema.minLength !== undefined) {
    badges.push(
      <code key="minLen" className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
        minLen: {schema.minLength}
      </code>
    );
  }
  if (schema.maxLength !== undefined) {
    badges.push(
      <code key="maxLen" className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
        maxLen: {schema.maxLength}
      </code>
    );
  }
  if (schema.enum && schema.enum.length > 0) {
    badges.push(
      <span key="enum" className="flex gap-1 flex-wrap">
        {schema.enum.map((v: unknown) => (
          <code key={String(v)} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
            {JSON.stringify(v)}
          </code>
        ))}
      </span>
    );
  }

  if (badges.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-1.5">{badges}</div>;
}

export function SchemaPropertyList({
  schema,
  spec,
  requiredFields = [],
  depth = 0,
}: SchemaPropertyListProps) {
  // Cap recursion depth to prevent infinite loops on circular schemas
  if (depth >= MAX_DEPTH) {
    return <p className="text-xs text-muted-foreground italic">Max depth reached</p>;
  }

  const resolved = resolveSchema(schema, spec) as ExtendedSchema;

  // Dangling $ref — show a clear unresolved indicator instead of silently showing "any"
  if (resolved._unresolvedRef) {
    return (
      <div className="py-2 flex items-center gap-2">
        <code className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded font-mono">
          $ref unresolved: {resolved._unresolvedRef}
        </code>
      </div>
    );
  }

  // Nullable / union type header — shown before properties or type label
  const nullableBadge = resolved._nullable ? (
    <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono ml-1">
      nullable
    </span>
  ) : null;
  const variantTypes: string[] | undefined = (resolved as any)._variantTypes;

  // Array type — render items schema
  if (resolved.type === 'array' && resolved.items) {
    return (
      <div>
        {nullableBadge && <div className="mb-2">{nullableBadge}</div>}
        <p className="text-xs text-muted-foreground mb-2 italic">Array of:</p>
        <div className="ml-2 border-l-2 border-border pl-4">
          <SchemaPropertyList
            schema={resolved.items}
            spec={spec}
            depth={depth + 1}
          />
        </div>
      </div>
    );
  }

  // Object type or schema with properties
  if (resolved.properties && Object.keys(resolved.properties).length > 0) {
    // Merge required from resolved schema AND from requiredFields prop (e.g. from parent requestBody)
    const required = Array.from(new Set([...(resolved.required ?? []), ...requiredFields]));
    return (
      <div>
      {nullableBadge && <div className="mb-2">{nullableBadge}</div>}
      <div className="space-y-0 divide-y divide-border">
        {Object.entries(resolved.properties).map(([propName, propSchema]) => {
          const isRequired = required.includes(propName);
          const resolvedProp = resolveSchema(propSchema, spec);
          const hasChildren =
            (resolvedProp.properties && Object.keys(resolvedProp.properties).length > 0) ||
            resolvedProp.type === 'array';

          return (
            <div key={propName} className="py-4">
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <span className="font-mono text-sm font-bold text-foreground">{propName}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {resolvedProp.type === 'array'
                    ? (() => {
                        const items = resolvedProp.items;
                        if (!items) return 'array';
                        // Resolve $ref to get the real type name
                        if ('$ref' in items) {
                          const refName = (items as ReferenceObject).$ref.split('/').pop() ?? 'object';
                          return `array[${refName}]`;
                        }
                        return `array[${(items as SchemaObject).type || 'object'}]`;
                      })()
                    : resolvedProp.type || 'object'}
                </span>
                {isRequired && (
                  <Badge variant="destructive" className="text-[10px] font-bold px-1.5 py-0 h-4 uppercase tracking-wider">
                    Required
                  </Badge>
                )}
              </div>
              <ConstraintBadges schema={resolvedProp} />
              {resolvedProp.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  {resolvedProp.description}
                </p>
              )}
              {hasChildren && depth < MAX_DEPTH - 1 && (
                <Accordion type="single" collapsible className="w-full mt-3">
                  <AccordionItem value="props" className="border-none">
                    <AccordionTrigger className="py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider [&>svg]:size-3 no-underline hover:no-underline">
                      Show properties
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0 ml-1.5 border-l-2 border-border pl-4">
                      <SchemaPropertyList
                        schema={resolvedProp}
                        spec={spec}
                        depth={depth + 1}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          );
        })}
      </div>
      </div>
    );
  }

  // Primitive or empty schema
  return (
    <div className="py-2 flex flex-wrap items-center gap-1.5">
      {variantTypes ? (
        // Multiple non-null variants — show all types separated by |
        variantTypes.flatMap((t, i) => [
          i > 0 ? <span key={`sep-${i}`} className="text-muted-foreground/50 text-xs">|</span> : null,
          <code key={t} className="font-mono text-xs text-muted-foreground">{t}</code>,
        ]).filter(Boolean)
      ) : (
        <span className="font-mono text-xs text-muted-foreground">
          {resolved.type || 'any'}
        </span>
      )}
      {nullableBadge}
      <ConstraintBadges schema={resolved} />
    </div>
  );
}

// ── Schema Detail View ────────────────────────────────────────────────────────

interface SchemaDetailViewProps {
  entry: SchemaEntry;
  spec: ParsedOpenAPISpec;
  onBack: () => void;
}

export function SchemaDetailView({ entry, spec, onBack }: SchemaDetailViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 lg:px-12 xl:max-w-3xl custom-scroll bg-transparent">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to endpoint
      </button>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl tracking-tight font-bold text-foreground mb-3">
          {entry.name}
        </h1>
        {entry.schema.description && (
          <div className="text-base text-muted-foreground leading-relaxed prose prose-sm md:prose-base prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {entry.schema.description}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <SchemaPropertyList schema={entry.schema} spec={spec} />
    </div>
  );
}
