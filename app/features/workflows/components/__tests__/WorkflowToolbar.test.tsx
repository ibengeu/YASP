import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowToolbar } from '../WorkflowToolbar';
import type { WorkflowDocument } from '../../types/workflow.types';

// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock workflow-io
vi.mock('../../services/workflow-io', () => ({
  exportWorkflow: vi.fn(() => '{}'),
  importWorkflow: vi.fn(() => ({ name: 'Imported', steps: [], serverUrl: '' })),
}));

const mockWorkflow: WorkflowDocument = {
  id: 'wf-1',
  name: 'Test Workflow',
  steps: [
    {
      id: 's1',
      order: 0,
      name: 'Step 1',
      request: { method: 'GET', path: '/api', headers: {}, queryParams: {} },
      extractions: [],
    },
  ],
  serverUrl: 'https://api.example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('WorkflowToolbar', () => {
  const defaultProps = {
    workflow: mockWorkflow,
    isRunning: false,
    onNameChange: vi.fn(),
    onRun: vi.fn(),
    onStop: vi.fn(),
    onSave: vi.fn(),
    onSettingsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render workflow name input', () => {
    render(<WorkflowToolbar {...defaultProps} />);

    const input = screen.getByDisplayValue('Test Workflow');
    expect(input).toBeInTheDocument();
  });

  it('should render Run Flow button when not running', () => {
    render(<WorkflowToolbar {...defaultProps} />);

    expect(screen.getByText('Run Flow')).toBeInTheDocument();
  });

  it('should render Test button alongside Run Flow', () => {
    render(<WorkflowToolbar {...defaultProps} />);

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Run Flow')).toBeInTheDocument();
  });

  it('should render Stop button when running', () => {
    render(<WorkflowToolbar {...defaultProps} isRunning={true} />);

    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.queryByText('Run Flow')).not.toBeInTheDocument();
  });

  it('should call onRun when Run Flow is clicked', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<WorkflowToolbar {...defaultProps} onRun={onRun} />);

    await user.click(screen.getByText('Run Flow'));
    expect(onRun).toHaveBeenCalled();
  });

  it('should call onStop when Stop is clicked', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(<WorkflowToolbar {...defaultProps} isRunning={true} onStop={onStop} />);

    await user.click(screen.getByText('Stop'));
    expect(onStop).toHaveBeenCalled();
  });

  it('should show status dot with appropriate styling when running', () => {
    const { container } = render(
      <WorkflowToolbar {...defaultProps} isRunning={true} />
    );

    const statusDot = container.querySelector('.animate-pulse');
    expect(statusDot).toBeTruthy();
  });

  it('should show last-run timestamp when provided', () => {
    render(
      <WorkflowToolbar
        {...defaultProps}
        lastRunAt="2024-01-01T00:00:00Z"
      />
    );

    expect(screen.getByText('Last run:')).toBeInTheDocument();
  });

  it('should have backdrop-blur glass toolbar styling', () => {
    const { container } = render(<WorkflowToolbar {...defaultProps} />);

    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar.className).toContain('backdrop-blur');
  });

  it('should disable Run Flow when workflow has no steps', () => {
    const emptyWorkflow = { ...mockWorkflow, steps: [] };
    render(<WorkflowToolbar {...defaultProps} workflow={emptyWorkflow} />);

    const runButton = screen.getByText('Run Flow').closest('button');
    expect(runButton).toBeDisabled();
  });
});
