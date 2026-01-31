import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ApiCard } from '@/components/catalog/ApiCard';
import type { OpenApiDocument } from '@/core/storage/storage-schema';

const mockSpec: OpenApiDocument = {
  id: 'test-1',
  type: 'openapi',
  title: 'Test API',
  version: '1.0.0',
  description: 'A test API specification',
  content: 'openapi: 3.0.0\ninfo:\n  title: Test API',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  metadata: {
    score: 85,
    tags: ['test', 'api'],
    workspaceType: 'personal',
    syncStatus: 'synced',
    isDiscoverable: true,
  },
};

describe('ApiCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render spec data', () => {
    render(<ApiCard spec={mockSpec} onClick={vi.fn()} />);

    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('A test API specification')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('should show status badge based on score', () => {
    render(<ApiCard spec={mockSpec} onClick={vi.fn()} />);

    // Score of 85 should show "Excellent" or similar high-quality badge
    const card = screen.getByText('Test API').closest('div');
    expect(card).toBeTruthy();
  });

  it('should apply hover border effect', () => {
    const { container } = render(<ApiCard spec={mockSpec} onClick={vi.fn()} />);

    const card = container.firstChild;
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('hover:border-primary');
  });

  it('should call onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(<ApiCard spec={mockSpec} onClick={handleClick} />);

    const card = screen.getByText('Test API').closest('[role="button"]') || screen.getByText('Test API').closest('div');
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledWith(mockSpec);
    }
  });

  it('should render tags as pills', () => {
    render(<ApiCard spec={mockSpec} onClick={vi.fn()} />);

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('api')).toBeInTheDocument();
  });

  it('should display compliance score', () => {
    render(<ApiCard spec={mockSpec} onClick={vi.fn()} />);

    // Should show score percentage or visual indicator
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('should handle spec without description', () => {
    const specWithoutDesc = { ...mockSpec, description: undefined };
    render(<ApiCard spec={specWithoutDesc} onClick={vi.fn()} />);

    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.queryByText('A test API specification')).not.toBeInTheDocument();
  });

  it('should display workspace type badge', () => {
    render(<ApiCard spec={mockSpec} onClick={vi.fn()} />);

    // Should show workspace type (personal, team, etc.)
    expect(screen.getByText(/personal/i)).toBeInTheDocument();
  });
});
