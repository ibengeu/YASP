// __tests__/TryItOut.spec.tsx
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {executeApiRequest, ResponseData} from '@/routes/spec-page/actions/execute-api-request';
import * as sonner from 'sonner';
import type {ComponentsObject, OperationObject} from '@/common/openapi-spec.ts';
import TryItOut from '@/routes/spec-page/components/try-it-out.tsx';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('@/routes/spec-page/actions/execute-api-request', () => ({
    executeApiRequest: vi.fn(),
}));
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mocked-uuid'),
}));

// Mock navigator.clipboard
const mockClipboardWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
    value: {writeText: mockClipboardWriteText},
    writable: true,
});

// Mock operation and components for OpenAPI
const mockOperation: OperationObject = {
    operationId: 'loginAdmin',
    summary: 'Admin login endpoint',
    parameters: [
        {
            name: 'clientId',
            in: 'query',
            required: true,
            schema: {type: 'string'},
            example: '12345',
        },
    ],
    requestBody: {
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        username: {type: 'string'},
                        password: {type: 'string'},
                    },
                    required: ['username', 'password'],
                },
                example: {username: 'admin', password: 'secret'},
            },
        },
        required: true,
    },
    security: [{apiKey: []}],
    responses: {
        '200': {description: 'Successful login'},
        '400': {description: 'Bad request'},
    },
};

// Mock operation without security
const mockOperationNoSecurity: OperationObject = {
    ...mockOperation,
    security: undefined,
};

// Mock operation with empty security
const mockOperationEmptySecurity: OperationObject = {
    ...mockOperation,
    security: [],
};

const mockComponents: ComponentsObject = {
    schemas: {},
    securitySchemes: {
        apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
        },
    },
};

// Mock components without security schemes
const mockComponentsNoSecuritySchemes: ComponentsObject = {
    schemas: {},
    securitySchemes: undefined,
};

// Default props
const defaultProps = {
    path: '/api/v1/Admins/login',
    method: 'post',
    operation: mockOperation,
    components: mockComponents,
};

// Setup and cleanup
beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
});

// Feature Slice: Component Rendering and Initialization
describe('TryItOut Component - Rendering and Initialization', () => {
    it('renders the component with correct initial UI elements', () => {
        render(<TryItOut {...defaultProps} />);

        expect(screen.getByRole('combobox', {name: /method/i})).toHaveValue('POST');
        expect(screen.getByRole('textbox', {name: ''})).toHaveValue('https://localhost:44345/api/v1/Admins/login');
        expect(screen.getByRole('button', {name: /send/i})).toBeInTheDocument();
        expect(screen.getByRole('tab', {name: /params/i})).toBeInTheDocument();
        expect(screen.getByRole('tab', {name: /headers/i})).toBeInTheDocument();
        expect(screen.getByRole('tab', {name: /body/i})).toBeInTheDocument();
        expect(screen.getByRole('tab', {name: /curl/i})).toBeInTheDocument();
    });

    it('initializes request body with sample data from schema', () => {
        render(<TryItOut {...defaultProps} />);

        const requestBodyTextarea = screen.getByPlaceholderText('Enter request body');
        expect(requestBodyTextarea).toHaveValue(JSON.stringify({username: 'admin', password: 'secret'}, null, 2));
    });

    it('adds security headers on mount for secured endpoint (OWASP A01:2021)', () => {
        render(<TryItOut {...defaultProps} />);

        expect(screen.getByDisplayValue('x-api-key')).toBeInTheDocument();
    });
});

// Feature Slice: Parameters
describe('TryItOut Component - Parameters', () => {
    it('renders query parameters and handles input changes', async () => {
        render(<TryItOut {...defaultProps} />);

        const paramInput = screen.getByPlaceholderText('Enter clientId');
        expect(paramInput).toBeInTheDocument();
        expect(paramInput).toHaveValue('');

        fireEvent.change(paramInput, {target: {value: 'test-client'}});
        expect(paramInput).toHaveValue('test-client');
    });

    it('sanitizes parameter inputs to prevent injection (OWASP A03:2021)', async () => {
        render(<TryItOut {...defaultProps} />);

        const paramInput = screen.getByPlaceholderText('Enter clientId');
        fireEvent.change(paramInput, {target: {value: '<script>alert("xss")</script>'}});
        expect(paramInput).toHaveValue('scriptalertxss/script');
    });

    it('displays required badge for mandatory parameters', () => {
        render(<TryItOut {...defaultProps} />);

        expect(screen.getByText('required')).toBeInTheDocument();
    });
});

// Feature Slice: Headers
describe('TryItOut Component - Headers', () => {
    it('renders default headers and allows adding new headers', async () => {
        render(<TryItOut {...defaultProps} />);

        expect(screen.getByDisplayValue('accept')).toHaveValue('*/*');
        expect(screen.getByDisplayValue('Content-Type')).toHaveValue('application/json; version=1.0');
        expect(screen.getByDisplayValue('x-clientId')).toHaveValue('9E7AE241D245463FB431A34AEFC93AD5');

        const newHeaderNameInput = screen.getByPlaceholderText('Header name').closest('input')!;
        const newHeaderValueInput = screen.getAllByPlaceholderText('Value')[3];
        const addButton = screen.getByRole('button', {name: /plus/i});

        fireEvent.change(newHeaderNameInput, {target: {value: 'x-custom-header'}});
        fireEvent.change(newHeaderValueInput, {target: {value: 'custom-value'}});
        fireEvent.click(addButton);

        expect(screen.getByDisplayValue('x-custom-header')).toHaveValue('x-custom-header');
        expect(screen.getByDisplayValue('custom-value')).toHaveValue('custom-value');
    });

    it('prevents adding headers exceeding size limit (OWASP A04:2021)', async () => {
        render(<TryItOut {...defaultProps} />);

        const newHeaderNameInput = screen.getByPlaceholderText('Header name').closest('input')!;
        const newHeaderValueInput = screen.getAllByPlaceholderText('Value')[3];
        const addButton = screen.getByRole('button', {name: /plus/i});

        const largeInput = 'a'.repeat(1025); // Exceeds 1KB limit
        fireEvent.change(newHeaderNameInput, {target: {value: 'x-custom-header'}});
        fireEvent.change(newHeaderValueInput, {target: {value: largeInput}});
        fireEvent.click(addButton);

        expect(sonner.toast.error).toHaveBeenCalledWith('Header name or value exceeds maximum size of 1KB.');
        expect(screen.queryByDisplayValue(largeInput)).not.toBeInTheDocument();
    });

    it('allows removing headers', async () => {
        render(<TryItOut {...defaultProps} />);

        const removeButton = screen.getAllByRole('button', {name: /trash2/i})[0];
        fireEvent.click(removeButton);

        expect(screen.queryByDisplayValue('accept')).not.toBeInTheDocument();
    });
});

// Feature Slice: Request Body
describe('TryItOut Component - Request Body', () => {
    it('renders request body textarea for POST method', () => {
        render(<TryItOut {...defaultProps} />);

        const requestBodyTextarea = screen.getByPlaceholderText('Enter request body');
        expect(requestBodyTextarea).toBeInTheDocument();
    });

    it('validates and updates request body with JSON', async () => {
        render(<TryItOut {...defaultProps} />);

        const requestBodyTextarea = screen.getByPlaceholderText('Enter request body');
        const newBody = JSON.stringify({username: 'test', password: 'test123'});
        fireEvent.change(requestBodyTextarea, {target: {value: newBody}});

        expect(requestBodyTextarea).toHaveValue(newBody);
    });

    it('prevents oversized request body (OWASP A04:2021)', async () => {
        render(<TryItOut {...defaultProps} />);

        const requestBodyTextarea = screen.getByPlaceholderText('Enter request body');
        const largeBody = 'a'.repeat(1024 * 1024 + 1); // Exceeds 1MB
        fireEvent.change(requestBodyTextarea, {target: {value: largeBody}});

        expect(sonner.toast.error).toHaveBeenCalledWith('Request body exceeds maximum size of 1MB.');
        expect(requestBodyTextarea).not.toHaveValue(largeBody);
    });

    it('formats JSON on button click', async () => {
        render(<TryItOut {...defaultProps} />);

        const requestBodyTextarea = screen.getByPlaceholderText('Enter request body');
        fireEvent.change(requestBodyTextarea, {target: {value: '{"username":"test","password":"test123"}'}});
        const formatButton = screen.getByRole('button', {name: /format json/i});
        fireEvent.click(formatButton);

        expect(requestBodyTextarea).toHaveValue(JSON.stringify({username: 'test', password: 'test123'}, null, 2));
        expect(sonner.toast.success).toHaveBeenCalledWith('Your JSON has been formatted successfully.');
    });
});

// Feature Slice: cURL Command
describe('TryItOut Component - cURL Command', () => {
    it('renders cURL command and copies to clipboard', async () => {
        render(<TryItOut {...defaultProps} />);

        const copyButton = screen.getByRole('button', {name: /copy/i});
        fireEvent.click(copyButton);

        expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('curl -X POST'));
        expect(sonner.toast.success).toHaveBeenCalledWith('Content copied to clipboard');
    });

    it('includes request body in cURL for POST', async () => {
        render(<TryItOut {...defaultProps} />);

        const curlPre = screen.getByText(/curl -X POST/i);
        expect(curlPre).toHaveTextContent(/-d/);
        expect(curlPre).toHaveTextContent(/username/);
    });
});

// Feature Slice: API Execution
describe('TryItOut Component - API Execution', () => {
    it('executes API request and displays response', async () => {
        const mockResponse: ResponseData = {
            status: 200,
            body: JSON.stringify({token: 'abc123'}),
            headers: {'content-type': 'application/json'},
            time: 500,
        };
        vi.mocked(executeApiRequest).mockResolvedValue(mockResponse);

        render(<TryItOut {...defaultProps} />);

        // Set a valid API key to satisfy security requirement
        const apiKeyInput = screen.getByDisplayValue('x-api-key').closest('input')!;
        fireEvent.change(apiKeyInput, {target: {value: 'valid-key'}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(executeApiRequest).toHaveBeenCalled();
            expect(screen.getByText('200 OK')).toBeInTheDocument();
            expect(screen.getByText(/abc123/)).toBeInTheDocument();
            expect(sonner.toast.success).toHaveBeenCalledWith('Request successful - Received status code 200');
        });
    });

    it('redacts sensitive data in response (OWASP A02:2021)', async () => {
        const mockResponse: ResponseData = {
            status: 200,
            body: JSON.stringify({token: 'abc123', password: 'secret'}),
            headers: {'content-type': 'application/json'},
            time: 500,
        };
        vi.mocked(executeApiRequest).mockResolvedValue(mockResponse);

        render(<TryItOut {...defaultProps} />);

        // Set a valid API key
        const apiKeyInput = screen.getByDisplayValue('x-api-key').closest('input')!;
        fireEvent.change(apiKeyInput, {target: {value: 'valid-key'}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(screen.getByText(/"token": "\*\*\*\*"/)).toBeInTheDocument();
            expect(screen.getByText(/"password": "\*\*\*\*"/)).toBeInTheDocument();
        });
    });

    it('handles API request timeout (OWASP A09:2021)', async () => {
        vi.mocked(executeApiRequest).mockRejectedValue(new DOMException('Timeout', 'AbortError'));

        render(<TryItOut {...defaultProps} />);

        // Set a valid API key
        const apiKeyInput = screen.getByDisplayValue('x-api-key').closest('input')!;
        fireEvent.change(apiKeyInput, {target: {value: 'valid-key'}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(sonner.toast.error).toHaveBeenCalledWith('Request timed out after 30 seconds.');
            expect(screen.getByText(/"error": "Request failed"/)).toBeInTheDocument();
        });
    });

    it('prevents submission when required security headers are missing for secured endpoint (OWASP A01:2021)', async () => {
        render(<TryItOut {...defaultProps} />);

        // Set API key to empty to trigger validation failure
        const apiKeyInput = screen.getByDisplayValue('x-api-key').closest('input')!;
        fireEvent.change(apiKeyInput, {target: {value: ''}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(sonner.toast.error).toHaveBeenCalledWith('Missing required security headers.');
            expect(executeApiRequest).not.toHaveBeenCalled();
        });
    });

    it('allows submission without security headers when security is undefined (OWASP A01:2021)', async () => {
        const mockResponse: ResponseData = {
            status: 200,
            body: JSON.stringify({message: 'success'}),
            headers: {'content-type': 'application/json'},
            time: 500,
        };
        vi.mocked(executeApiRequest).mockResolvedValue(mockResponse);

        render(<TryItOut {...defaultProps} operation={mockOperationNoSecurity}/>);

        // Set a valid parameter to ensure submission is not blocked by other validations
        const paramInput = screen.getByPlaceholderText('Enter clientId');
        fireEvent.change(paramInput, {target: {value: 'test-client'}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(executeApiRequest).toHaveBeenCalled();
            expect(sonner.toast.success).toHaveBeenCalledWith('Request successful - Received status code 200');
            expect(screen.getByText('200 OK')).toBeInTheDocument();
        });
    });

    it('allows submission without security headers when security is empty (OWASP A01:2021)', async () => {
        const mockResponse: ResponseData = {
            status: 200,
            body: JSON.stringify({message: 'success'}),
            headers: {'content-type': 'application/json'},
            time: 500,
        };
        vi.mocked(executeApiRequest).mockResolvedValue(mockResponse);

        render(<TryItOut {...defaultProps} operation={mockOperationEmptySecurity}/>);

        // Set a valid parameter
        const paramInput = screen.getByPlaceholderText('Enter clientId');
        fireEvent.change(paramInput, {target: {value: 'test-client'}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(executeApiRequest).toHaveBeenCalled();
            expect(sonner.toast.success).toHaveBeenCalledWith('Request successful - Received status code 200');
            expect(screen.getByText('200 OK')).toBeInTheDocument();
        });
    });

    it('allows submission without security headers when securitySchemes is undefined (OWASP A01:2021)', async () => {
        const mockResponse: ResponseData = {
            status: 200,
            body: JSON.stringify({message: 'success'}),
            headers: {'content-type': 'application/json'},
            time: 500,
        };
        vi.mocked(executeApiRequest).mockResolvedValue(mockResponse);

        render(<TryItOut {...defaultProps} components={mockComponentsNoSecuritySchemes}/>);

        // Set a valid parameter
        const paramInput = screen.getByPlaceholderText('Enter clientId');
        fireEvent.change(paramInput, {target: {value: 'test-client'}});

        const sendButton = screen.getByRole('button', {name: /send/i});
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(executeApiRequest).toHaveBeenCalled();
            expect(sonner.toast.success).toHaveBeenCalledWith('Request successful - Received status code 200');
            expect(screen.getByText('200 OK')).toBeInTheDocument();
        });
    });
});