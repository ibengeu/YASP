import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PageHeader } from '@/components/navigation/PageHeader';

describe('PageHeader', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render with title and description', () => {
    render(
      <PageHeader
        title="Test Page"
        description="This is a test description"
      />
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should render actions in the right slot', () => {
    render(
      <PageHeader
        title="Test Page"
        description="Test description"
        actions={<button>Action Button</button>}
      />
    );

    const button = screen.getByRole('button', { name: 'Action Button' });
    expect(button).toBeInTheDocument();
  });

  it('should render extra content below title/description', () => {
    render(
      <PageHeader
        title="Test Page"
        description="Test description"
        extraContent={<div>Extra filters here</div>}
      />
    );

    expect(screen.getByText('Extra filters here')).toBeInTheDocument();
  });

  it('should apply correct responsive padding classes', () => {
    const { container } = render(
      <PageHeader title="Test" description="Test desc" />
    );

    const header = container.querySelector('.px-4, .md\\:px-6, .lg\\:px-8');
    expect(header).toBeTruthy();
  });
});
