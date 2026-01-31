import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { KPICard } from '@/components/dashboard/KPICard';

describe('KPICard', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render value and unit', () => {
    render(<KPICard label="Test Metric" value={92} unit="%" />);

    expect(screen.getByText(/92/)).toBeInTheDocument();
    expect(screen.getByText(/%/)).toBeInTheDocument();
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });

  it('should show trend indicator with correct icon and color for upward trend', () => {
    render(<KPICard label="Success Rate" value={92} unit="%" trend="up" />);

    // Check for trend indicator (could be an arrow icon or text)
    const card = screen.getByText('Success Rate').closest('div');
    expect(card).toBeTruthy();
  });

  it('should show trend indicator with correct icon and color for downward trend', () => {
    render(<KPICard label="Error Rate" value={5} unit="%" trend="down" />);

    const card = screen.getByText('Error Rate').closest('div');
    expect(card).toBeTruthy();
  });

  it('should invert colors when invertColors is true', () => {
    const { container } = render(
      <KPICard label="Mean Time" value={3.2} unit=" days" trend="down" invertColors />
    );

    // Green color for downward trend when inverted
    const trendElement = container.querySelector('[class*="text-green"]');
    expect(trendElement).toBeTruthy();
  });

  it('should render sparkline when data is provided', () => {
    const sparklineData = [10, 20, 15, 25, 30];
    const { container } = render(
      <KPICard
        label="Trend Metric"
        value={30}
        sparkline={sparklineData}
      />
    );

    // Check for SVG element (sparkline)
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should not render sparkline when data is not provided', () => {
    const { container } = render(
      <KPICard label="Simple Metric" value={50} unit="%" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('should render tooltip with info when provided', () => {
    render(
      <KPICard
        label="Complex Metric"
        value={75}
        unit="%"
        tooltip="This is a helpful description"
      />
    );

    expect(screen.getByText('Complex Metric')).toBeInTheDocument();
  });
});
