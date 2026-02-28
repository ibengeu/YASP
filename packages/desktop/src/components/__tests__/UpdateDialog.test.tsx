import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UpdateDialog } from '../UpdateDialog';
import type { UpdateState } from '../../hooks/useUpdateCheck';

function makeState(overrides: Partial<UpdateState> = {}): UpdateState {
  return {
    update: { available: true, version: '3.1.0', body: 'Release notes here', downloadAndInstall: vi.fn() } as any,
    open: true,
    isDownloading: false,
    dismiss: vi.fn(),
    install: vi.fn(),
    ...overrides,
  };
}

describe('UpdateDialog — no update', () => {
  it('renders nothing when update is null', () => {
    const { container } = render(<UpdateDialog state={makeState({ update: null })} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('UpdateDialog — dialog content', () => {
  it('renders the version in the title', () => {
    render(<UpdateDialog state={makeState()} />);
    expect(screen.getByText(/v3\.1\.0/)).toBeInTheDocument();
  });

  it('renders release notes when body is present', () => {
    render(<UpdateDialog state={makeState()} />);
    expect(screen.getByText('Release notes here')).toBeInTheDocument();
  });

  it('does not render release notes section when body is absent', () => {
    render(<UpdateDialog state={makeState({ update: { available: true, version: '3.1.0', body: undefined, downloadAndInstall: vi.fn() } as any })} />);
    expect(screen.queryByText('Release notes here')).not.toBeInTheDocument();
  });
});

describe('UpdateDialog — actions', () => {
  it('calls dismiss when Later is clicked', async () => {
    const state = makeState();
    render(<UpdateDialog state={state} />);
    await userEvent.click(screen.getByRole('button', { name: /later/i }));
    expect(state.dismiss).toHaveBeenCalledOnce();
  });

  it('calls install when Install & Restart is clicked', async () => {
    const state = makeState();
    render(<UpdateDialog state={state} />);
    await userEvent.click(screen.getByRole('button', { name: /install & restart/i }));
    expect(state.install).toHaveBeenCalledOnce();
  });
});

describe('UpdateDialog — downloading state', () => {
  it('disables both buttons while downloading', () => {
    render(<UpdateDialog state={makeState({ isDownloading: true })} />);
    expect(screen.getByRole('button', { name: /later/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /installing/i })).toBeDisabled();
  });

  it('changes install button label to "Installing…" while downloading', () => {
    render(<UpdateDialog state={makeState({ isDownloading: true })} />);
    expect(screen.getByRole('button', { name: /installing…/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /install & restart/i })).not.toBeInTheDocument();
  });
});
