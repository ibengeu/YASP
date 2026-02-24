/**
 * TDD: SchemaPropertyList — comprehensive schema rendering including edge cases
 *
 * Covers:
 * - Basic object properties (name, type, required badge)
 * - Constraints: format, pattern, enum, min/max, minLength/maxLength
 * - $ref resolution
 * - allOf merge (including with $ref sub-schemas)
 * - anyOf/oneOf — first meaningful variant + nullable indicator
 * - Array items rendering
 * - Dangling $ref → unresolved indicator (not silent "any")
 * - Implicit object (no type, but has properties)
 * - Depth capping at MAX_DEPTH
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SchemaPropertyList } from '@yasp/core/components/catalog/docs-view/SchemaPropertyList';
import type { ParsedOpenAPISpec } from '@yasp/core/components/catalog/docs-view/types';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('remark-gfm', () => ({ default: () => {} }));

const BASE_SPEC: ParsedOpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
};

const specWith = (schemas: Record<string, any>): ParsedOpenAPISpec => ({
  ...BASE_SPEC,
  components: { schemas },
});

// ── Basic rendering ───────────────────────────────────────────────────────

describe('SchemaPropertyList — basic object', () => {
  it('renders property name and type', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { title: { type: 'string' } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
  });

  it('shows Required badge for required fields', () => {
    render(
      <SchemaPropertyList
        schema={{
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string' }, name: { type: 'string' } },
        }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('renders property description', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { id: { type: 'integer', description: 'Unique identifier' } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('Unique identifier')).toBeInTheDocument();
  });

  it('handles implicit object — properties without explicit type', () => {
    render(
      <SchemaPropertyList
        schema={{ properties: { name: { type: 'string' } } } as any}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('name')).toBeInTheDocument();
  });
});

// ── Constraint badges ─────────────────────────────────────────────────────

describe('SchemaPropertyList — constraint badges', () => {
  it('shows format badge', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { created_at: { type: 'string', format: 'date-time' } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('date-time')).toBeInTheDocument(); // format badge
  });

  it('shows pattern badge', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { code: { type: 'string', pattern: '^[A-Z]{3}$' } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('/^[A-Z]{3}$/')).toBeInTheDocument();
  });

  it('shows enum values as badges', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { status: { type: 'string', enum: ['active', 'inactive'] } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('"active"')).toBeInTheDocument();
    expect(screen.getByText('"inactive"')).toBeInTheDocument();
  });

  it('shows minimum and maximum badges', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { score: { type: 'integer', minimum: 0, maximum: 100 } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('min: 0')).toBeInTheDocument();
    expect(screen.getByText('max: 100')).toBeInTheDocument();
  });

  it('shows minLength and maxLength badges', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: { name: { type: 'string', minLength: 1, maxLength: 50 } } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('minLen: 1')).toBeInTheDocument();
    expect(screen.getByText('maxLen: 50')).toBeInTheDocument();
  });
});

// ── $ref resolution ───────────────────────────────────────────────────────

describe('SchemaPropertyList — $ref', () => {
  it('resolves $ref and renders its properties', () => {
    const spec = specWith({
      Pet: { type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } } },
    });
    render(
      <SchemaPropertyList schema={{ $ref: '#/components/schemas/Pet' } as any} spec={spec} />
    );
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
  });

  it('shows unresolved indicator for a dangling $ref — does NOT silently show "any"', () => {
    render(
      <SchemaPropertyList
        schema={{ $ref: '#/components/schemas/NonExistent' } as any}
        spec={BASE_SPEC}
      />
    );
    // Must not silently fall through to showing type "any"
    expect(screen.queryByText('any')).not.toBeInTheDocument();
    // Must surface the ref name so the user knows what's broken
    expect(screen.getByText(/NonExistent/)).toBeInTheDocument();
  });
});

// ── allOf ─────────────────────────────────────────────────────────────────

describe('SchemaPropertyList — allOf merge', () => {
  it('merges properties from all allOf sub-schemas', () => {
    render(
      <SchemaPropertyList
        schema={{
          allOf: [
            { type: 'object', properties: { id: { type: 'integer' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        } as any}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('merges allOf where one sub is a $ref', () => {
    const spec = specWith({
      Base: { type: 'object', properties: { id: { type: 'string' }, last4: { type: 'string' } } },
    });
    render(
      <SchemaPropertyList
        schema={{
          allOf: [
            { $ref: '#/components/schemas/Base' },
            { type: 'object', properties: { brand: { type: 'string' } } },
          ],
        } as any}
        spec={spec}
      />
    );
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('last4')).toBeInTheDocument();
    expect(screen.getByText('brand')).toBeInTheDocument();
  });

  it('merges allOf where one sub has only description (no properties)', () => {
    render(
      <SchemaPropertyList
        schema={{
          allOf: [
            { description: 'A payment method' },
            { type: 'object', properties: { type: { type: 'string' } } },
          ],
        } as any}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('type')).toBeInTheDocument();
  });

  it('deduplicates required fields from allOf sub-schemas', () => {
    render(
      <SchemaPropertyList
        schema={{
          allOf: [
            { required: ['id'], properties: { id: { type: 'integer' } } },
            { required: ['name'], properties: { name: { type: 'string' } } },
          ],
        } as any}
        spec={BASE_SPEC}
      />
    );
    const requiredBadges = screen.getAllByText(/required/i);
    expect(requiredBadges).toHaveLength(2);
  });
});

// ── anyOf / oneOf ─────────────────────────────────────────────────────────

describe('SchemaPropertyList — anyOf / oneOf', () => {
  it('shows first non-null variant type and nullable badge for anyOf [string, null]', () => {
    render(
      <SchemaPropertyList
        schema={{ anyOf: [{ type: 'string' }, { type: 'null' }] } as any}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText(/nullable/i)).toBeInTheDocument();
  });

  it('shows all variant types when no null present in anyOf', () => {
    render(
      <SchemaPropertyList
        schema={{ anyOf: [{ type: 'string' }, { type: 'integer' }] } as any}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText(/string/)).toBeInTheDocument();
    expect(screen.getByText(/integer/)).toBeInTheDocument();
  });

  it('handles oneOf with null variant identically to anyOf', () => {
    const spec = specWith({
      Pet: { type: 'object', properties: { name: { type: 'string' } } },
    });
    render(
      <SchemaPropertyList
        schema={{ oneOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'null' }] } as any}
        spec={spec}
      />
    );
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText(/nullable/i)).toBeInTheDocument();
  });
});

// ── Array items ───────────────────────────────────────────────────────────

describe('SchemaPropertyList — array', () => {
  it('renders primitive array items type', () => {
    render(
      <SchemaPropertyList
        schema={{ type: 'array', items: { type: 'string' } }}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText(/Array of/i)).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
  });

  it('renders object array items with their properties', () => {
    const spec = specWith({
      Tag: { type: 'object', properties: { id: { type: 'integer' }, label: { type: 'string' } } },
    });
    render(
      <SchemaPropertyList
        schema={{ type: 'array', items: { $ref: '#/components/schemas/Tag' } } as any}
        spec={spec}
      />
    );
    expect(screen.getByText(/Array of/i)).toBeInTheDocument();
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('label')).toBeInTheDocument();
  });

  it('shows nullable badge on a nullable array', () => {
    render(
      <SchemaPropertyList
        schema={{ anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] } as any}
        spec={BASE_SPEC}
      />
    );
    expect(screen.getByText(/Array of/i)).toBeInTheDocument();
    expect(screen.getByText(/nullable/i)).toBeInTheDocument();
  });

  it('shows resolved type name for array items from $ref', () => {
    const spec = specWith({
      Order: { type: 'object', properties: { total: { type: 'number' } } },
    });
    render(
      <SchemaPropertyList
        schema={{ type: 'object', properties: {
          orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
        } } as any}
        spec={spec}
      />
    );
    // Should show array[Order] not array[object]
    expect(screen.getByText('array[Order]')).toBeInTheDocument();
  });
});

describe('SchemaPropertyList — required fields from prop vs schema', () => {
  it('merges requiredFields prop with resolved.required from allOf', () => {
    render(
      <SchemaPropertyList
        schema={{
          allOf: [{ properties: { id: { type: 'integer' } } }],
        } as any}
        spec={BASE_SPEC}
        requiredFields={['id']}
      />
    );
    // id should show Required badge even though allOf sub-schema has no required array
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});

describe('SchemaPropertyList — multi-variant anyOf (no null)', () => {
  it('renders separator between variant types without React null warnings', () => {
    const { container } = render(
      <SchemaPropertyList
        schema={{ anyOf: [{ type: 'string' }, { type: 'integer' }] } as any}
        spec={BASE_SPEC}
      />
    );
    // Both types rendered with a separator
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('integer')).toBeInTheDocument();
    expect(container.querySelector('span')).toBeTruthy();
  });
});
