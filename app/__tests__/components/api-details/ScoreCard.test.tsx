import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ScoreCard } from '@/components/api-details/ScoreCard';

describe('ScoreCard', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render score and label', () => {
    render(<ScoreCard label="Compliance Score" score={92} />);

    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('should render progress bar with correct width', () => {
    const { container } = render(<ScoreCard label="Quality Score" score={75} />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeTruthy();
    expect(progressBar?.getAttribute('style')).toContain('75%');
  });

  it('should show "Excellent" status for scores >= 90', () => {
    render(<ScoreCard label="Score" score={95} />);

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('should show "Good" status for scores 70-89', () => {
    render(<ScoreCard label="Score" score={80} />);

    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('should show "Needs Attention" status for scores 50-69', () => {
    render(<ScoreCard label="Score" score={60} />);

    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('should show "Critical" status for scores < 50', () => {
    render(<ScoreCard label="Score" score={30} />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should apply correct color for excellent scores', () => {
    render(<ScoreCard label="Score" score={95} />);

    // Check for green color class
    const badge = screen.getByText('Excellent').closest('div');
    expect(badge?.className).toContain('green');
  });

  it('should apply correct color for critical scores', () => {
    render(<ScoreCard label="Score" score={30} />);

    // Check for red color class
    const badge = screen.getByText('Critical').closest('div');
    expect(badge?.className).toContain('red');
  });
});
