import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ResponsePanel} from '@yasp/core/components/api-details/ResponsePanel';

// Mock CodeMirror
vi.mock('@codemirror/view', () => {
    const EditorView = vi.fn().mockImplementation(() => ({
        state: {doc: {toString: () => ''}},
        dispatch: vi.fn(),
        destroy: vi.fn(),
    }));
    (EditorView as any).updateListener = {of: () => ({})};
    (EditorView as any).theme = () => ({});
    (EditorView as any).editable = {of: () => ({})};
    (EditorView as any).lineWrapping = {};
    return {EditorView, lineNumbers: () => ({})};
});
vi.mock('@codemirror/state', () => ({
    EditorState: {
        create: vi.fn().mockReturnValue({}),
        readOnly: {of: () => ({})},
    },
}));
vi.mock('@codemirror/lang-json', () => ({json: () => ({})}));
vi.mock('@codemirror/theme-one-dark', () => ({oneDark: {}}));

beforeEach(() => {
    // Mock clipboard (navigator.clipboard may be read-only in some environments)
    Object.defineProperty(navigator, 'clipboard', {
        value: {writeText: vi.fn().mockResolvedValue(undefined)},
        writable: true,
        configurable: true,
    });
});

afterEach(() => {
    cleanup();
});

describe('ResponsePanel', () => {
    it('should show empty state when no response', () => {
        render(<ResponsePanel response={null} isLoading={false}/>);
        expect(screen.getByText('Send a request to see the response')).toBeInTheDocument();
    });

    it('should show loading spinner when loading', () => {
        render(<ResponsePanel response={null} isLoading={true}/>);
        expect(screen.getByText('Response')).toBeInTheDocument();
        // Should not show empty state
        expect(screen.queryByText('Send a request to see the response')).not.toBeInTheDocument();
    });

    it('should display status code with color coding for success', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            time: 150,
            size: 1.2,
            headers: {'content-type': 'application/json'},
            body: {data: 'test'},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);
        expect(screen.getByText('200 OK')).toBeInTheDocument();
        expect(screen.getByText('150ms')).toBeInTheDocument();
        expect(screen.getByText('1.2KB')).toBeInTheDocument();
    });

    it('should display status code with error color for 4xx/5xx', () => {
        const response = {
            status: 404,
            statusText: 'Not Found',
            time: 50,
            size: 0.1,
            headers: {},
            body: {error: 'not found'},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);
        const statusEl = screen.getByText('404 Not Found');
        expect(statusEl.className).toContain('text-destructive');
    });

    it('should render Body and Headers tabs', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            time: 100,
            size: 0.5,
            headers: {'x-request-id': '123'},
            body: {ok: true},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);
        expect(screen.getByTestId('response-tab-body')).toBeInTheDocument();
        expect(screen.getByTestId('response-tab-headers')).toBeInTheDocument();
    });

    it('should show headers count badge', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            time: 100,
            size: 0.5,
            headers: {'content-type': 'application/json', 'x-request-id': '123'},
            body: {},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);
        // Should show count in headers tab (plain number, no parentheses)
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should have copy response button', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            time: 100,
            size: 0.5,
            headers: {},
            body: {result: 'data'},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);
        expect(screen.getByTestId('copy-response-btn')).toBeInTheDocument();
    });

    it('should have word wrap toggle button', () => {
        const response = {
            status: 200,
            statusText: 'OK',
            time: 100,
            size: 0.5,
            headers: {},
            body: {},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);
        expect(screen.getByTestId('word-wrap-toggle')).toBeInTheDocument();
    });

    it('should switch to headers tab and show header table', async () => {
        const user = userEvent.setup();
        const response = {
            status: 200,
            statusText: 'OK',
            time: 100,
            size: 0.5,
            headers: {'content-type': 'application/json', 'x-request-id': 'abc123'},
            body: {},
        };
        render(<ResponsePanel response={response} isLoading={false}/>);

        await user.click(screen.getByTestId('response-tab-headers'));

        expect(screen.getByText('content-type')).toBeInTheDocument();
        expect(screen.getByText('application/json')).toBeInTheDocument();
        expect(screen.getByText('x-request-id')).toBeInTheDocument();
        expect(screen.getByText('abc123')).toBeInTheDocument();
    });

});
