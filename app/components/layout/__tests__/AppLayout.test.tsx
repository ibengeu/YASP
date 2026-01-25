/**
 * AppLayout Component Tests
 * Main application layout wrapper
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { AppLayout } from '../AppLayout';

describe('AppLayout', () => {
  describe('rendering', () => {
    it('should render navigation', () => {
      render(
        <BrowserRouter>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('YASP')).toBeInTheDocument();
    });

    it('should render children in main content area', () => {
      render(
        <BrowserRouter>
          <AppLayout>
            <div data-testid="test-content">Test Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should use Linear design system classes', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('bg-background');
    });
  });

  describe('user prop forwarding', () => {
    it('should pass user to navigation', () => {
      const user = { name: 'Jane Doe', email: 'jane@example.com' };

      render(
        <BrowserRouter>
          <AppLayout user={user}>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('maxWidth prop', () => {
    it('should apply default max width', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      const contentWrapper = container.querySelector('.max-w-7xl');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('should allow custom max width', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout maxWidth="max-w-5xl">
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      const contentWrapper = container.querySelector('.max-w-5xl');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('should support full width layout', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout maxWidth="max-w-full">
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      const contentWrapper = container.querySelector('.max-w-full');
      expect(contentWrapper).toBeInTheDocument();
    });
  });

  describe('padding prop', () => {
    it('should apply default padding', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('px-6', 'py-8');
    });

    it('should allow no padding', () => {
      const { container } = render(
        <BrowserRouter>
          <AppLayout padding={false}>
            <div>Content</div>
          </AppLayout>
        </BrowserRouter>
      );

      const main = container.querySelector('main');
      expect(main).not.toHaveClass('px-6', 'py-8');
    });
  });
});
