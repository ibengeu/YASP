import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import type {ComponentsObject, OperationObject} from '@/common/swagger.types';
import '@testing-library/jest-dom';
import React, {ReactNode} from "react";
import {EndpointDetail} from "@/routes/spec-page/components/endpoint-detail.tsx";

vi.mock('@/components/ui/badge', () => ({
    Badge: ({children, variant, className}: { children: React.ReactNode; variant?: string; className?: string }) => (
        <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
    ),
}));
vi.mock('@/components/ui/scroll-area', () => ({
    ScrollArea: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/tabs', () => ({
    Tabs: ({children, value, onValueChange}: {
        children: React.ReactNode;
        value: string;
        onValueChange: (value: string) => void
    }) => (
        <div data-testid="tabs" data-value={value}
             onClick={(e) => onValueChange((e.target as HTMLElement).dataset.value || '')}>
            {children}
        </div>
    ),
    TabsList: ({children}: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({children, value}: { children: React.ReactNode; value: string }) => (
        <button data-testid="tabs-trigger" data-value={value}>
            {children}
        </button>
    ),
    TabsContent: ({children, value}: { children: React.ReactNode; value: string }) => (
        <div data-testid="tabs-content" data-value={value}>
            {children}
        </div>
    ),
}));
vi.mock('@/routes/spec-page/components/schema-table', () => ({
    SchemaTable: ({schema}: { schema: unknown }) => <div data-testid="schema-table">{JSON.stringify(schema)}</div>,
}));
vi.mock('@/lib/utils', () => ({
    cn: (...args: string[]) => args.join(' '),
}));
const defaultProps = {
    path: '/users',
    method: 'get',
    operation: {summary: 'Get all users'} as OperationObject,
    components: {} as ComponentsObject,
};

function setup(jsx: ReactNode) {
    return {
        user: userEvent.setup(),
        ...render(jsx),
    }
}

describe('EndpointDetail', () => {
    it('displays HTTP method, path, and summary', () => {
        render(<EndpointDetail {...defaultProps} />);
        expect(screen.getByTestId('badge')).toHaveTextContent(/GET/i);
        expect(screen.getByText('/users')).toBeInTheDocument();
        expect(screen.getByText('Get all users')).toBeInTheDocument();
    });
    it('displays description when provided', () => {
        const props = {
            ...defaultProps,
            method: 'post',
            operation: {summary: 'Create a user', description: 'Creates a new user in the system.'},
        };
        setup(<EndpointDetail {...props} />);
        expect(screen.getByText('Creates a new user in the system.')).toBeInTheDocument();
    });
    it('displays parameters table when parameters are provided', () => {
        const props = {
            ...defaultProps,
            path: '/users/{id}',
            operation: {
                parameters: [
                    {name: 'id', in: 'path', required: true, description: 'User ID', schema: {type: 'string'}},
                    {name: 'limit', in: 'query', required: false, schema: {type: 'integer'}},
                ],
            },
        };
        setup(<EndpointDetail {...props} />);
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        expect(rows).toHaveLength(3);
        expect(within(rows[1]).getByText('id')).toBeInTheDocument();
        expect(within(rows[1]).getByText('path')).toBeInTheDocument();
        expect(within(rows[1]).getByText('string')).toBeInTheDocument();
        expect(within(rows[1]).getByTestId('badge')).toHaveTextContent('Required');
        expect(within(rows[1]).getByText('User ID')).toBeInTheDocument();
        expect(within(rows[2]).getByText('limit')).toBeInTheDocument();
        expect(within(rows[2]).getByText('query')).toBeInTheDocument();
        expect(within(rows[2]).getByText('integer')).toBeInTheDocument();
        expect(within(rows[2]).getByTestId('badge')).toHaveTextContent('Optional');
        expect(within(rows[2]).getByText('-')).toBeInTheDocument();
    });
    it('displays request body with content type', async () => {
        const props = {
            ...defaultProps,
            method: 'post',
            operation: {
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {schema: {type: 'object', properties: {name: {type: 'string'}}}},
                        'multipart/form-data': {
                            schema: {type: 'object', properties: {file: {type: 'string', format: 'binary'}}},
                        },
                    },
                },
            },
        };
        setup(<EndpointDetail {...props} />);
        expect(screen.getByText('Request Body')).toBeInTheDocument();
        const requestBodySection = screen.getByText('Request Body').closest('div')!;
        const contentTypeBadge = within(requestBodySection).getByText(/application\/json/);
        expect(contentTypeBadge).toBeInTheDocument();
        const requiredBadge = within(requestBodySection).getByText(/Required/);
        expect(requiredBadge).toBeInTheDocument();
        expect(screen.getByTestId('schema-table')).toHaveTextContent('name');
    });
    it('displays responses with content type selection', async () => {
        const props = {
            ...defaultProps,
            operation: {
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {schema: {type: 'array', items: {type: 'string'}}},
                            'text/plain': {schema: {type: 'string'}},
                        },
                    },
                    '404': {description: 'Not found'},
                },
            },
        };
        setup(<EndpointDetail {...props} />);
        expect(screen.getByText('Responses')).toBeInTheDocument();
        const responsesSection = screen.getByText('Responses').closest('div')!;
        const status200Section = within(responsesSection).getByText('Successful response').closest('div')!;
        expect(within(status200Section).getByTestId('badge')).toHaveTextContent(/200/);
        expect(screen.getByText('Successful response')).toBeInTheDocument();
        expect(within(responsesSection).getByTestId('tabs')).toBeInTheDocument();
        const tabs = within(responsesSection).getByTestId('tabs');
        const jsonTrigger = within(tabs).getByText(/application\/json/);
        const textTrigger = within(tabs).getByText(/text\/plain/i);
        expect(jsonTrigger).toBeInTheDocument();
        expect(textTrigger).toBeInTheDocument();
        const schemaTables = within(tabs).getAllByTestId('schema-table');
        expect(schemaTables[0]).toHaveTextContent('array');
        await userEvent.click(textTrigger);
        await screen.findByText('text/plain');
        expect(schemaTables[1]).toHaveTextContent('string');
        const status404Section = within(responsesSection).getByText('Not found').closest('div')!;
        expect(within(status404Section).getByTestId('badge')).toHaveTextContent(/404/);
        expect(screen.getByText('Not found')).toBeInTheDocument();
    });
    it('handles reference objects correctly', () => {
        const props = {
            ...defaultProps,
            method: 'post',
            operation: {
                parameters: [{$ref: '#/components/parameters/UserId'}],
                requestBody: {$ref: '#/components/requestBodies/User'},
                responses: {'200': {$ref: '#/components/responses/Success'}},
            },
        };
        setup(<EndpointDetail {...props} />);
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByText('Request Body')).not.toBeInTheDocument();
        expect(screen.getByText('Reference: #/components/responses/Success')).toBeInTheDocument();
    });
    it('handles empty operation object', () => {
        const props = {...defaultProps, operation: {}};
        setup(<EndpointDetail {...props} />);
        expect(screen.getByTestId('badge')).toHaveTextContent(/GET/i);
        expect(screen.getByText('/users')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByText('Request Body')).not.toBeInTheDocument();
        expect(screen.queryByText('Responses')).not.toBeInTheDocument();
    });
    it('handles unknown HTTP method', () => {
        const props = {...defaultProps, method: 'INVALID', operation: {summary: 'Test'}};
        setup(<EndpointDetail {...props} />);
        expect(screen.getByTestId('badge')).toHaveTextContent('INVALID');
    });
    it('handles request body and responses with no content types', () => {
        const props = {
            ...defaultProps,
            method: 'post',
            operation: {
                requestBody: {content: {}},
                responses: {'200': {description: 'Success', content: {}}},
            },
        };
        setup(<EndpointDetail {...props} />);

        expect(screen.queryByText('Request Body')).not.toBeInTheDocument();

        const badges = screen.getAllByTestId('badge');
        expect(badges).toHaveLength(2);
        expect(badges[0]).toHaveTextContent('post');
        expect(badges[1]).toHaveTextContent('200');

        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.queryByTestId('schema-table')).not.toBeInTheDocument();
    });

    it('matches snapshot', () => {
        const props = {
            ...defaultProps,
            operation: {
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {schema: {type: 'array', items: {type: 'string'}}},
                        },
                    },
                },
            },
        };
        const {asFragment} = render(<EndpointDetail {...props} />);
        expect(asFragment()).toMatchSnapshot();
    });
    it('handles large number of parameters efficiently', () => {
        const props = {
            ...defaultProps,
            operation: {
                parameters: Array(100)
                    .fill(null)
                    .map((_, i) => ({name: `param${i}`, in: 'query', schema: {type: 'string'}})),
            },
        };
        const start = performance.now();
        render(<EndpointDetail {...props} />);
        const end = performance.now();
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        expect(rows).toHaveLength(101);
        expect(end - start).toBeLessThan(1000);
    });
});