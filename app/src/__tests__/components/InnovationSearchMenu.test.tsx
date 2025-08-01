import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InnovationSearchMenu from '../../components/InnovationSearchMenu';
import type { User } from '../../types';

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

  it('displays search results with AI explanation', async () => {
    const user = userEvent.setup();
    
    const mockSearchResult = {
      query: 'IoT innovation',
      top_innovation: {
        id: 'test_id',
        nama_inovasi: 'Smart IoT Sensor System',
        nama_inovator: 'test_innovator',
        similarity: 0.85,
        latar_belakang: 'Background about IoT...',
        tujuan_inovasi: 'Goals of IoT innovation...',
        deskripsi_inovasi: 'Description of IoT system...',
        link_document: 'http://test.com/doc.pdf'
      },
      ai_explanation: 'This IoT innovation focuses on smart sensor technology that can revolutionize various industries.',
      results: [
        {
          id: 'test_id',
          nama_inovasi: 'Smart IoT Sensor System',
          nama_inovator: 'test_innovator',
          similarity: 0.85,
          latar_belakang: 'Background about IoT...',
          tujuan_inovasi: 'Goals of IoT innovation...',
          deskripsi_inovasi: 'Description of IoT system...',
          link_document: 'http://test.com/doc.pdf'
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResult
    });

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Perform search
    await user.type(searchInput, 'IoT innovation');
    await user.click(searchButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/search results for/i)).toBeInTheDocument();
      expect(screen.getByText('Smart IoT Sensor System')).toBeInTheDocument();
      expect(screen.getByText(/ai explanation/i)).toBeInTheDocument();
      expect(screen.getByText(/this iot innovation focuses on smart sensor technology/i)).toBeInTheDocument();
      expect(screen.getByText(/similarity: 85%/i)).toBeInTheDocument();
    });
  });

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockRejectedValueOnce(new Error('Search failed'));

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Perform search
    await user.type(searchInput, 'IoT innovation');
    await user.click(searchButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });

    // Form should be re-enabled
    expect(searchButton).not.toBeDisabled();
    expect(searchInput).not.toBeDisabled();
  });

  it('validates empty search query', async () => {
    const user = userEvent.setup();
    
    render(<InnovationSearchMenu user={mockUser} />);

    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Try to search with empty query
    await user.click(searchButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/please enter a search query/i)).toBeInTheDocument();
  });

  it('makes correct API call with proper headers', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: 'test query',
        top_innovation: null,
        ai_explanation: 'Test explanation',
        results: []
      })
    });

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Perform search
    await user.type(searchInput, 'test query');
    await user.click(searchButton);

    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/search_inovasi',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'X-Inovator': 'test_user'
          },
          body: expect.any(FormData)
        })
      );
    });

    // Check FormData content
    const call = mockFetch.mock.calls[0];
    const formData = call[1].body as FormData;
    expect(formData.get('query')).toBe('test query');
    expect(formData.get('table_name')).toBe('innovations');
  });

  it('displays multiple search results correctly', async () => {
    const user = userEvent.setup();
    
    const mockSearchResult = {
      query: 'innovation search',
      top_innovation: {
        id: 'top_id',
        nama_inovasi: 'Top Innovation',
        similarity: 0.95
      },
      ai_explanation: 'Multiple innovations found.',
      results: [
        {
          id: 'result_1',
          nama_inovasi: 'Innovation 1',
          nama_inovator: 'innovator_1',
          similarity: 0.85,
          latar_belakang: 'Background 1',
          tujuan_inovasi: 'Goals 1',
          deskripsi_inovasi: 'Description 1',
          link_document: 'http://test1.pdf'
        },
        {
          id: 'result_2',
          nama_inovasi: 'Innovation 2',
          nama_inovator: 'innovator_2',
          similarity: 0.75,
          latar_belakang: 'Background 2',
          tujuan_inovasi: 'Goals 2',
          deskripsi_inovasi: 'Description 2',
          link_document: 'http://test2.pdf'
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResult
    });

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // Perform search
    await user.type(searchInput, 'innovation search');
    await user.click(searchButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Innovation 1')).toBeInTheDocument();
      expect(screen.getByText('Innovation 2')).toBeInTheDocument();
      expect(screen.getByText(/similarity: 85%/i)).toBeInTheDocument();
      expect(screen.getByText(/similarity: 75%/i)).toBeInTheDocument();
      expect(screen.getByText('innovator_1')).toBeInTheDocument();
      expect(screen.getByText('innovator_2')).toBeInTheDocument();
    });
  });

  it('clears previous results when new search is performed', async () => {
    const user = userEvent.setup();
    
    // First search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: 'first search',
        top_innovation: null,
        ai_explanation: 'First explanation',
        results: [{
          id: 'first_result',
          nama_inovasi: 'First Innovation',
          nama_inovator: 'first_innovator',
          similarity: 0.8,
          latar_belakang: 'First background',
          tujuan_inovasi: 'First goals',
          deskripsi_inovasi: 'First description',
          link_document: 'http://first.pdf'
        }]
      })
    });

    render(<InnovationSearchMenu user={mockUser} />);

    const searchInput = screen.getByLabelText(/search query/i);
    const searchButton = screen.getByRole('button', { name: /search innovations/i });

    // First search
    await user.type(searchInput, 'first search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('First Innovation')).toBeInTheDocument();
    });

    // Second search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: 'second search',
        top_innovation: null,
        ai_explanation: 'Second explanation',
        results: [{
          id: 'second_result',
          nama_inovasi: 'Second Innovation',
          nama_inovator: 'second_innovator',
          similarity: 0.9,
          latar_belakang: 'Second background',
          tujuan_inovasi: 'Second goals',
          deskripsi_inovasi: 'Second description',
          link_document: 'http://second.pdf'
        }]
      })
    });

    await user.clear(searchInput);
    await user.type(searchInput, 'second search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Second Innovation')).toBeInTheDocument();
      expect(screen.queryByText('First Innovation')).not.toBeInTheDocument();
    });
  });
});
