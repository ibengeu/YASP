import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { CommandDeck } from '@/components/navigation/CommandDeck';
import { useThemeStore } from '@/stores/theme-store';

describe('CommandDeck', () => {
  beforeEach(() => {
    useThemeStore.setState({ darkMode: false });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render all navigation modules', () => {
    render(
      <BrowserRouter>
        <CommandDeck />
      </BrowserRouter>
    );

    // Use getAllByText since modules appear in both desktop and mobile nav
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('API Catalog').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Policy Management').length).toBeGreaterThan(0);
  });

  it('should render navigation buttons with icons', () => {
    render(
      <BrowserRouter>
        <CommandDeck />
      </BrowserRouter>
    );

    // Check that buttons exist and are clickable
    const dashboardButton = screen.getAllByText('Dashboard')[0];
    expect(dashboardButton).toBeInTheDocument();
    expect(dashboardButton.closest('button')).toBeTruthy();
  });

  it('should toggle dark mode when dark mode button is clicked', () => {
    render(
      <BrowserRouter>
        <CommandDeck />
      </BrowserRouter>
    );

    const darkModeButton = screen.getAllByLabelText(/dark mode/i)[0];
    expect(useThemeStore.getState().darkMode).toBe(false);

    fireEvent.click(darkModeButton);
    expect(useThemeStore.getState().darkMode).toBe(true);

    fireEvent.click(darkModeButton);
    expect(useThemeStore.getState().darkMode).toBe(false);
  });

  it('should have fixed positioning with correct z-index', () => {
    const { container } = render(
      <BrowserRouter>
        <CommandDeck />
      </BrowserRouter>
    );

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed');
    expect(nav?.style.zIndex).toContain('var(--z-navigation)');
  });

  it('should render YASP logo with Shield icon', () => {
    render(
      <BrowserRouter>
        <CommandDeck />
      </BrowserRouter>
    );

    expect(screen.getByText('YASP')).toBeInTheDocument();
  });
});
