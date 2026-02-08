import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EndpointSidebar } from '@/components/api-details/EndpointSidebar';

describe('EndpointSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  const mockSpec = {
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/users': {
        get: {
          summary: 'List users',
          tags: ['Users'],
          responses: { '200': { description: 'OK' } },
        },
        post: {
          summary: 'Create user',
          tags: ['Users'],
          responses: { '201': { description: 'Created' } },
        },
      },
      '/pets': {
        get: {
          summary: 'List pets',
          tags: ['Pets'],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  };

  const onSelectEndpoint = vi.fn();

  describe('variant="detail" (default)', () => {
    it('should render grouped endpoints with tag headers', () => {
      render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="detail"
        />
      );

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Pets')).toBeInTheDocument();
    });

    it('should render search input', () => {
      const { container } = render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="detail"
        />
      );

      const searchInput = container.querySelector('input[placeholder*="Search"]');
      expect(searchInput).toBeTruthy();
    });

    it('should filter endpoints by search query', () => {
      const { container } = render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="detail"
        />
      );

      const searchInput = container.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'pets' } });

      // Should show Pets group but hide Users group
      expect(screen.getByText('Pets')).toBeInTheDocument();
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });

    it('should show endpoint count in footer', () => {
      render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="detail"
        />
      );

      expect(screen.getByText('3 endpoints')).toBeInTheDocument();
      expect(screen.getByText('2 groups')).toBeInTheDocument();
    });

    it('should call onSelectEndpoint when an endpoint is clicked', () => {
      render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="detail"
        />
      );

      // /users appears twice (GET + POST), click the first one
      const userEndpoints = screen.getAllByText('/users');
      fireEvent.click(userEndpoints[0]);
      expect(onSelectEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/users',
          method: 'get',
        })
      );
    });

    it('should toggle group collapse when tag header is clicked', () => {
      render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="detail"
        />
      );

      // Initially all groups are expanded, so endpoints visible
      const userEndpoints = screen.getAllByText('/users');
      expect(userEndpoints.length).toBe(2);

      // Click Users tag to collapse
      fireEvent.click(screen.getByText('Users'));

      // /users endpoints should be hidden
      expect(screen.queryAllByText('/users')).toHaveLength(0);
    });
  });

  describe('variant="editor"', () => {
    it('should render flat list without tag grouping', () => {
      render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="editor"
        />
      );

      // Should show endpoints (multiple /users for GET and POST)
      const userEndpoints = screen.getAllByText('/users');
      expect(userEndpoints.length).toBe(2);
      expect(screen.getByText('/pets')).toBeInTheDocument();

      // Should NOT have footer with endpoints count
      expect(screen.queryByText('3 endpoints')).not.toBeInTheDocument();
    });

    it('should show operations count header', () => {
      render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={null}
          onSelectEndpoint={onSelectEndpoint}
          variant="editor"
        />
      );

      expect(screen.getByText('Endpoints')).toBeInTheDocument();
      expect(screen.getByText('3 operations')).toBeInTheDocument();
    });

    it('should highlight selected endpoint', () => {
      const { container } = render(
        <EndpointSidebar
          spec={mockSpec}
          selectedEndpoint={{ path: '/users', method: 'get' }}
          onSelectEndpoint={onSelectEndpoint}
          variant="editor"
        />
      );

      // Selected endpoint should have accent styling
      const selectedButton = container.querySelector('.bg-accent');
      expect(selectedButton).toBeTruthy();
    });
  });

  it('should return null when spec has no paths', () => {
    const emptySpec = {
      openapi: '3.1.0',
      info: { title: 'Empty', version: '1.0.0' },
      paths: {},
    };

    const { container } = render(
      <EndpointSidebar
        spec={emptySpec}
        selectedEndpoint={null}
        onSelectEndpoint={onSelectEndpoint}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
