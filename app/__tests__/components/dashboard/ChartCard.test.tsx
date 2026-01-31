import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChartCard } from '@/components/dashboard/ChartCard';

describe('ChartCard', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render with title', () => {
    render(
      <ChartCard title="Test Chart">
        <div>Chart Content</div>
      </ChartCard>
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Chart Content')).toBeInTheDocument();
  });

  it('should render children inside card container', () => {
    const { container } = render(
      <ChartCard title="Data Visualization">
        <svg data-testid="test-chart" />
      </ChartCard>
    );

    const chart = container.querySelector('[data-testid="test-chart"]');
    expect(chart).toBeTruthy();
  });

  it('should apply card styling', () => {
    const { container } = render(
      <ChartCard title="Styled Chart">
        <div>Content</div>
      </ChartCard>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('dark:bg-[#0a0a0a]');
  });
});
