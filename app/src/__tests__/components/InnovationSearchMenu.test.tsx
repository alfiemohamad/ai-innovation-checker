import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InnovationSearchMenu from '../../../components/InnovationSearchMenu';
import type { User } from '../../../types';

const mockUser: User = { name: 'test_user' };

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('InnovationSearchMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders search form correctly', () => {
    render(<InnovationSearchMenu user={mockUser} />);
    
    expect(screen.getByText('Innovation Search')).toBeInTheDocument();
    expect(screen.getByLabelText(/search query/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search innovations/i })).toBeInTheDocument();
    expect(screen.getByText(/search for innovations using natural language/i)).toBeInTheDocument();
  });

  it('enables search button when query is entered', async () => {
    const user = userEvent.setup();
    
    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Initially disabled
    expect(searchButton).toBeDisabled();

    // Enter query
    await user.type(searchInput, 'IoT innovation');

    // Should be enabled now
    expect(searchButton).not.toBeDisabled();
  });

  it('shows loading state during search', async () => {
    const user = userEvent.setup();
    
    // Mock search response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              query: 'IoT innovation',
              top_innovation: {
                id: 'test_id',
                nama_inovasi: 'Test IoT Innovation',
                similarity: 0.85
              },
              ai_explanation: 'This is a test explanation',
              results: []
            })
          });
        }, 100);
      })
    );

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Enter query and search
    await user.type(searchInput, 'IoT innovation');
    await user.click(searchButton);

    // Check loading state
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    expect(searchButton).toBeDisabled();
    expect(searchInput).toBeDisabled();
  });

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockRejectedValueOnce(new Error('Search failed'));

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Enter query and search
    await user.type(searchInput, 'IoT innovation');
    await user.click(searchButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });
});
