import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutionResultsPanel } from '../ExecutionResultsPanel';
import type { WorkflowStep, StepExecutionResult } from '../../types/workflow.types';

const mockSteps: WorkflowStep[] = [
  {
    id: 'step-1',
    order: 0,
    name: 'Create User Record',
    request: {
      method: 'POST',
      path: '/v1/users/create',
      headers: { 'Content-Type': 'application/json' },
      queryParams: {},
    },
    extractions: [],
  },
  {
    id: 'step-2',
    order: 1,
    name: 'Generate Access Token',
    request: {
      method: 'GET',
      path: '/v1/auth/token',
      headers: {},
      queryParams: {},
    },
    extractions: [],
  },
];

const mockResults: StepExecutionResult[] = [
  {
    stepId: 'step-1',
    status: 'success',
    response: {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: { id: '123', name: 'John' },
      time: 245,
      size: 512,
    },
    extractedVariables: {},
  },
  {
    stepId: 'step-2',
    status: 'success',
    response: {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: { token: 'eyJhbGciOiJIUz...' },
      time: 120,
      size: 256,
    },
    extractedVariables: {},
  },
];

describe('ExecutionResultsPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the header with status indicator and duration', () => {
    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={true}
        onClose={vi.fn()}
        startedAt="2024-01-01T00:00:00.000Z"
        completedAt="2024-01-01T00:00:01.240Z"
        status="completed"
      />
    );

    expect(screen.getByText('Run Successful')).toBeInTheDocument();
    expect(screen.getByText(/1\.2s/)).toBeInTheDocument();
  });

  it('should show "Run Failed" status when workflow has failures', () => {
    const failedResults: StepExecutionResult[] = [
      {
        stepId: 'step-1',
        status: 'failure',
        error: 'Connection refused',
        extractedVariables: {},
      },
    ];

    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={failedResults}
        isOpen={true}
        onClose={vi.fn()}
        status="failed"
      />
    );

    expect(screen.getByText('Run Failed')).toBeInTheDocument();
  });

  it('should display step rows with step numbers and names', () => {
    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={true}
        onClose={vi.fn()}
        status="completed"
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('should show HTTP status codes in result rows', () => {
    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={true}
        onClose={vi.fn()}
        status="completed"
      />
    );

    const statusElements = screen.getAllByText('200 OK');
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('should show response output summaries', () => {
    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={true}
        onClose={vi.fn()}
        status="completed"
      />
    );

    // Should show truncated JSON output
    expect(screen.getByText(/Create User Record/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={true}
        onClose={handleClose}
        status="completed"
      />
    );

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it('should be hidden when isOpen is false (translate-y-full)', () => {
    const { container } = render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={false}
        onClose={vi.fn()}
        status="completed"
      />
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('translate-y-full');
  });

  it('should show empty state when no results', () => {
    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={[]}
        isOpen={true}
        onClose={vi.fn()}
        status="idle"
      />
    );

    expect(screen.getByText('No results yet')).toBeInTheDocument();
  });

  it('should show error messages for failed steps', () => {
    const failedResults: StepExecutionResult[] = [
      {
        stepId: 'step-1',
        status: 'failure',
        error: 'Connection refused',
        extractedVariables: {},
      },
    ];

    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={failedResults}
        isOpen={true}
        onClose={vi.fn()}
        status="failed"
      />
    );

    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('should show step duration for completed steps', () => {
    render(
      <ExecutionResultsPanel
        steps={mockSteps}
        results={mockResults}
        isOpen={true}
        onClose={vi.fn()}
        status="completed"
      />
    );

    expect(screen.getByText('245ms')).toBeInTheDocument();
    expect(screen.getByText('120ms')).toBeInTheDocument();
  });
});
