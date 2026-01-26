/**
 * AppNavigation Component Tests
 * Linear-inspired navigation system
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { AppNavigation } from '../AppNavigation';

// Mock useLocation with a simpler approach
const mockUseLocation = vi.fn(() => ({ pathname: '/' }));

vi.mock('react-router', () => ({
  BrowserRouter: ({ children }: any) => children,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useLocation: () => mockUseLocation(),
}));

describe('AppNavigation', () => {
  describe('rendering', () => {
    it('should render navigation container', () => {
      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should display YASP logo/brand', () => {
      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      expect(screen.getByText('YASP')).toBeInTheDocument();
    });

    it('should render main navigation links', () => {
      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      expect(screen.getByText('Library')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should use Linear design tokens', () => {
      const { container } = render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('border-b', 'border-border');
    });
  });

  describe('active state', () => {
    it('should highlight active route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' });

      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      const libraryLink = screen.getByText('Library').closest('a');
      expect(libraryLink).toHaveClass('text-foreground');
    });

    it('should dim inactive routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/settings' });

      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      const libraryLink = screen.getByText('Library').closest('a');
      expect(libraryLink).toHaveClass('text-muted-foreground');
    });
  });

  describe('keyboard navigation', () => {
    it('should be keyboard accessible', () => {
      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('responsive design', () => {
    it('should render mobile menu trigger on small screens', () => {
      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      // Mobile menu button should exist
      const menuButton = screen.queryByLabelText(/menu/i);
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('user menu', () => {
    it('should display user avatar when authenticated', () => {
      render(
        <BrowserRouter>
          <AppNavigation user={{ name: 'John Doe', email: 'john@example.com' }} />
        </BrowserRouter>
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should show login button when not authenticated', () => {
      render(
        <BrowserRouter>
          <AppNavigation />
        </BrowserRouter>
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});
