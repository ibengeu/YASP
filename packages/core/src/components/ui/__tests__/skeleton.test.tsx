/**
 * Skeleton Component Tests
 * Loading placeholder for content
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SpecCardSkeleton, StatsCardSkeleton } from '../skeleton';

describe('Skeleton', () => {
  describe('basic skeleton', () => {
    it('should render with default classes', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('.animate-pulse');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('rounded-md', 'bg-muted');
    });

    it('should accept custom className', () => {
      const { container } = render(<Skeleton className="h-4 w-full" />);
      const skeleton = container.querySelector('.animate-pulse');

      expect(skeleton).toHaveClass('h-4', 'w-full');
    });

    it('should render as a div by default', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;

      expect(skeleton?.nodeName).toBe('DIV');
    });
  });

  describe('SpecCardSkeleton', () => {
    it('should render card structure', () => {
      const { container } = render(<SpecCardSkeleton />);

      // Should have main card container
      expect(container.querySelector('.rounded-lg.border')).toBeInTheDocument();
    });

    it('should render header skeleton', () => {
      const { container } = render(<SpecCardSkeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');

      // Should have multiple skeleton elements
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render tags skeleton', () => {
      render(<SpecCardSkeleton />);

      // Should render skeleton elements for tags (3 tags)
      const tagSkeletons = screen.getAllByTestId('tag-skeleton');
      expect(tagSkeletons).toHaveLength(3);
    });

    it('should render footer skeleton', () => {
      render(<SpecCardSkeleton />);

      const footerSkeleton = screen.getByTestId('footer-skeleton');
      expect(footerSkeleton).toBeInTheDocument();
    });

    it('should render score circle skeleton', () => {
      render(<SpecCardSkeleton />);

      const scoreSkeleton = screen.getByTestId('score-skeleton');
      expect(scoreSkeleton).toBeInTheDocument();
    });
  });

  describe('StatsCardSkeleton', () => {
    it('should render card structure', () => {
      const { container } = render(<StatsCardSkeleton />);

      expect(container.querySelector('.rounded-lg.border')).toBeInTheDocument();
    });

    it('should render icon skeleton', () => {
      render(<StatsCardSkeleton />);

      const iconSkeleton = screen.getByTestId('icon-skeleton');
      expect(iconSkeleton).toBeInTheDocument();
    });

    it('should render value skeleton', () => {
      render(<StatsCardSkeleton />);

      const valueSkeleton = screen.getByTestId('value-skeleton');
      expect(valueSkeleton).toBeInTheDocument();
    });

    it('should render label skeleton', () => {
      render(<StatsCardSkeleton />);

      const labelSkeleton = screen.getByTestId('label-skeleton');
      expect(labelSkeleton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on skeleton', () => {
      render(<Skeleton aria-label="Loading content" />);

      expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
    });

    it('should have aria-busy on loading states', () => {
      const { container } = render(<SpecCardSkeleton />);
      const card = container.querySelector('[aria-busy="true"]');

      expect(card).toBeInTheDocument();
    });

    it('should have role status for screen readers', () => {
      render(<SpecCardSkeleton />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
