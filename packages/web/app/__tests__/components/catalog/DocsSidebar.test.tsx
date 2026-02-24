/**
 * TDD: DocsSidebar — model interaction, SchemaEntry[], buttons, count badge
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocsSidebar } from '@yasp/core/components/catalog/docs-view/DocsSidebar';
import type { EndpointGroup, SchemaEntry } from '@yasp/core/components/catalog/docs-view/types';

const GROUPS: EndpointGroup[] = [
  {
    tag: 'Pets',
    count: 2,
    endpoints: [
      {
        path: '/pets',
        method: 'GET',
        operation: { summary: 'List pets', responses: {} } as any,
        tags: ['Pets'],
        summary: 'List pets',
      },
      {
        path: '/pets/{id}',
        method: 'GET',
        operation: { summary: 'Get pet', responses: {} } as any,
        tags: ['Pets'],
        summary: 'Get pet',
      },
    ],
  },
];

const MODELS: SchemaEntry[] = [
  { name: 'Pet', schema: { type: 'object', properties: { id: { type: 'integer' } } } },
  { name: 'User', schema: { type: 'object', properties: { name: { type: 'string' } } } },
];

describe('DocsSidebar — data models as buttons', () => {
  it('renders model names as buttons, not anchor tags', () => {
    render(
      <DocsSidebar
        groups={[]}
        selectedEndpoint={null}
        onSelectEndpoint={() => {}}
        dataModels={MODELS}
        filterQuery=""
        setFilterQuery={() => {}}
      />
    );
    const petBtn = screen.getByRole('button', { name: /Pet/i });
    expect(petBtn.tagName).toBe('BUTTON');
    const userBtn = screen.getByRole('button', { name: /User/i });
    expect(userBtn.tagName).toBe('BUTTON');
  });

  it('calls onSelectModel when a model button is clicked', () => {
    const onSelectModel = vi.fn();
    render(
      <DocsSidebar
        groups={[]}
        selectedEndpoint={null}
        onSelectEndpoint={() => {}}
        dataModels={MODELS}
        filterQuery=""
        setFilterQuery={() => {}}
        onSelectModel={onSelectModel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Pet/i }));
    expect(onSelectModel).toHaveBeenCalledWith(MODELS[0]);
  });

  it('highlights selected model', () => {
    render(
      <DocsSidebar
        groups={[]}
        selectedEndpoint={null}
        onSelectEndpoint={() => {}}
        dataModels={MODELS}
        filterQuery=""
        setFilterQuery={() => {}}
        selectedModel={MODELS[0]}
        onSelectModel={() => {}}
      />
    );
    const petBtn = screen.getByRole('button', { name: /Pet/i });
    expect(petBtn.className).toMatch(/primary/);
  });
});

describe('DocsSidebar — endpoint count badge', () => {
  it('shows endpoint count badge per group', () => {
    render(
      <DocsSidebar
        groups={GROUPS}
        selectedEndpoint={null}
        onSelectEndpoint={() => {}}
        dataModels={[]}
        filterQuery=""
        setFilterQuery={() => {}}
      />
    );
    // Count badge should show "2" for the Pets group
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
