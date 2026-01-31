import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PolicyTable } from '@/components/policies/PolicyTable';

const mockPolicies = [
  {
    id: '1',
    name: 'API Must Have Description',
    category: 'Documentation',
    severity: 'error' as const,
    enabled: true,
    description: 'All APIs must include a description field',
  },
  {
    id: '2',
    name: 'Security Scheme Required',
    category: 'Security',
    severity: 'error' as const,
    enabled: false,
    description: 'API must define at least one security scheme',
  },
];

describe('PolicyTable', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render all policies', () => {
    render(<PolicyTable policies={mockPolicies} onToggle={vi.fn()} />);

    expect(screen.getByText('API Must Have Description')).toBeInTheDocument();
    expect(screen.getByText('Security Scheme Required')).toBeInTheDocument();
  });

  it('should display severity badges', () => {
    render(<PolicyTable policies={mockPolicies} onToggle={vi.fn()} />);

    const errorBadges = screen.getAllByText('Error');
    expect(errorBadges.length).toBe(2);
  });

  it('should display category tags', () => {
    render(<PolicyTable policies={mockPolicies} onToggle={vi.fn()} />);

    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('should call onToggle when switch is clicked', () => {
    const handleToggle = vi.fn();
    render(<PolicyTable policies={mockPolicies} onToggle={handleToggle} />);

    const switches = screen.getAllByRole('button');
    // First switch should be the toggle for first policy
    fireEvent.click(switches[0]);

    expect(handleToggle).toHaveBeenCalledWith('1');
  });

  it('should show enabled state correctly', () => {
    const { container } = render(<PolicyTable policies={mockPolicies} onToggle={vi.fn()} />);

    // Check for enabled/disabled visual states
    const switches = container.querySelectorAll('button[class*="bg-"]');
    expect(switches.length).toBeGreaterThan(0);
  });

  it('should display policy descriptions', () => {
    render(<PolicyTable policies={mockPolicies} onToggle={vi.fn()} />);

    expect(screen.getByText('All APIs must include a description field')).toBeInTheDocument();
    expect(screen.getByText('API must define at least one security scheme')).toBeInTheDocument();
  });
});
