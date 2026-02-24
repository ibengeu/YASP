import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestBar } from '@yasp/core/components/workbench/RequestBar';

describe('RequestBar', () => {
  const defaultProps = {
    method: 'GET' as const,
    url: 'https://api.example.com/pets',
    onUrlChange: vi.fn(),
    onMethodChange: vi.fn(),
    onSend: vi.fn(),
    isSending: false,
  };

  it('should render method dropdown with selected value', () => {
    render(<RequestBar {...defaultProps} />);
    const select = screen.getByDisplayValue('GET');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
  });

  it('should render the URL input with value', () => {
    render(<RequestBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter request URL');
    expect(input).toHaveValue('https://api.example.com/pets');
  });

  it('should render Send Request button', () => {
    render(<RequestBar {...defaultProps} />);
    expect(screen.getByText('Send Request')).toBeInTheDocument();
  });

  it('should call onUrlChange when URL input changes', () => {
    const onUrlChange = vi.fn();
    render(<RequestBar {...defaultProps} onUrlChange={onUrlChange} />);
    fireEvent.change(screen.getByPlaceholderText('Enter request URL'), {
      target: { value: 'https://new-url.com' },
    });
    expect(onUrlChange).toHaveBeenCalledWith('https://new-url.com');
  });

  it('should call onMethodChange when method dropdown changes', () => {
    const onMethodChange = vi.fn();
    render(<RequestBar {...defaultProps} onMethodChange={onMethodChange} />);
    fireEvent.change(screen.getByDisplayValue('GET'), {
      target: { value: 'POST' },
    });
    expect(onMethodChange).toHaveBeenCalledWith('POST');
  });

  it('should call onSend when Send Request button is clicked', () => {
    const onSend = vi.fn();
    render(<RequestBar {...defaultProps} onSend={onSend} />);
    fireEvent.click(screen.getByText('Send Request'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('should show Sending... when isSending is true', () => {
    render(<RequestBar {...defaultProps} isSending={true} />);
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });
});
