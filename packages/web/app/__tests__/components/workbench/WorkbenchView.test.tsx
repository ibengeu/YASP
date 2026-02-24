import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkbenchView } from '@yasp/core/components/workbench/WorkbenchView';

// Mock react-router's useFetcher
vi.mock('react-router', () => ({
  useFetcher: () => ({
    state: 'idle',
    data: null,
    submit: vi.fn(),
  }),
}));

// Mock idb-storage
vi.mock('@yasp/core/core/storage/idb-storage', () => ({
  idbStorage: {
    getSpec: vi.fn().mockResolvedValue({
      id: 'spec-1',
      title: 'Petstore',
      version: '1.0.0',
      content: JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Petstore', version: '1.0.0' },
        servers: [{ url: 'https://petstore.example.com' }],
        paths: {
          '/pets': {
            get: {
              summary: 'List all pets',
              tags: ['pets'],
              parameters: [],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }),
      metadata: { score: 80 },
    }),
  },
}));

// Mock action-tracker
vi.mock('@yasp/core/lib/action-tracker', () => ({
  incrementAction: vi.fn(),
}));

// Mock sub-components to keep test fast
vi.mock('@yasp/core/components/api-details/EndpointSidebar', () => ({
  EndpointSidebar: () => <div data-testid="endpoint-sidebar">EndpointSidebar</div>,
}));
vi.mock('@yasp/core/components/api-details/RequestParamsTable', () => ({
  RequestParamsTable: () => <div data-testid="params-table">Params</div>,
}));
vi.mock('@yasp/core/components/api-details/RequestHeadersTable', () => ({
  RequestHeadersTable: () => <div data-testid="headers-table">Headers</div>,
}));
vi.mock('@yasp/core/components/api-details/RequestAuthPanel', () => ({
  RequestAuthPanel: () => <div data-testid="auth-panel">Auth</div>,
}));
vi.mock('@yasp/core/components/api-details/RequestBodyEditor', () => ({
  RequestBodyEditor: () => <div data-testid="body-editor">Body</div>,
}));
vi.mock('@yasp/core/components/api-details/ResponsePanel', () => ({
  ResponsePanel: () => <div data-testid="response-panel">Response</div>,
}));

describe('WorkbenchView', () => {
  it('should render loading state initially', () => {
    render(<WorkbenchView specId="spec-1" />);
    expect(screen.getByText('Loading specification...')).toBeInTheDocument();
  });

  it('should render request tabs after loading', async () => {
    render(<WorkbenchView specId="spec-1" />);
    expect(await screen.findByTestId('tab-params')).toBeInTheDocument();
    expect(screen.getByTestId('tab-auth')).toBeInTheDocument();
    expect(screen.getByTestId('tab-headers')).toBeInTheDocument();
    expect(screen.getByTestId('tab-body')).toBeInTheDocument();
  });

  it('should render response panel after loading', async () => {
    render(<WorkbenchView specId="spec-1" />);
    expect(await screen.findByTestId('response-panel')).toBeInTheDocument();
  });
});
