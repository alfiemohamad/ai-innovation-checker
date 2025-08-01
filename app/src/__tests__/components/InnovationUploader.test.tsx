import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InnovationUploader from '../../components/InnovationUploader';
import type { User } from '../../types';

const mockUser: User = { name: 'test_user' };
const mockOnUploadSuccess = vi.fn();
const mockOnUpdateInnovationList = vi.fn();

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('InnovationUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders upload form correctly', () => {
    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );
    
    expect(screen.getByText('Upload New Innovation')).toBeInTheDocument();
    expect(screen.getByLabelText(/judul inovasi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
  });

  it('enables upload button when form is filled', async () => {
    const user = userEvent.setup();
    
    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i);
    const fileInput = screen.getByLabelText(/upload pdf/i);
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Initially disabled
    expect(uploadButton).toBeDisabled();

    // Fill title
    await user.type(titleInput, 'Test Innovation');
    expect(uploadButton).toBeDisabled(); // Still disabled without file

    // Add file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);

    // Should be enabled now
    expect(uploadButton).not.toBeDisabled();
  });

  it('shows loading state during upload', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        innovation_id: 'test_id',
        ai_summary: {
          ringkasan_singkat: 'Test summary',
          masalah_yang_diatasi: 'Test problem',
          solusi_yang_ditawarkan: 'Test solution',
          potensi_manfaat: 'Test benefits',
          keunikan_inovasi: 'Test uniqueness'
        },
        extracted_sections: {
          latar_belakang: '✓',
          tujuan_inovasi: '✓',
          deskripsi_inovasi: '✓'
        }
      })
    });

    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i);
    const fileInput = screen.getByLabelText(/upload pdf/i);
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Fill form
    await user.type(titleInput, 'Test Innovation');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);

    // Submit form
    await user.click(uploadButton);

    // Check loading state
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(screen.getByText(/sedang mengupload dan memproses dokumen/i)).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
    expect(titleInput).toBeDisabled();
    expect(fileInput).toBeDisabled();

    // Wait for upload to complete
    await waitFor(() => {
      expect(screen.getByText(/inovasi berhasil diupload/i)).toBeInTheDocument();
    });
  });

  it('displays AI summary after successful upload', async () => {
    const user = userEvent.setup();
    
    const mockResponse = {
      status: 'success',
      innovation_id: 'test_id',
      ai_summary: {
        ringkasan_singkat: 'This is a test innovation summary',
        masalah_yang_diatasi: 'This solves test problems',
        solusi_yang_ditawarkan: 'This offers test solutions',
        potensi_manfaat: 'This provides test benefits',
        keunikan_inovasi: 'This has test uniqueness'
      },
      extracted_sections: {
        latar_belakang: '✓',
        tujuan_inovasi: '✗',
        deskripsi_inovasi: '✓'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i);
    const fileInput = screen.getByLabelText(/upload pdf/i);
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Fill and submit form
    await user.type(titleInput, 'Test Innovation');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);
    await user.click(uploadButton);

    // Wait for success message and AI summary
    await waitFor(() => {
      expect(screen.getByText(/inovasi berhasil diupload/i)).toBeInTheDocument();
      expect(screen.getByText(/ringkasan ai/i)).toBeInTheDocument();
      expect(screen.getByText('This is a test innovation summary')).toBeInTheDocument();
      expect(screen.getByText('This solves test problems')).toBeInTheDocument();
      expect(screen.getByText('This offers test solutions')).toBeInTheDocument();
      expect(screen.getByText('This provides test benefits')).toBeInTheDocument();
      expect(screen.getByText('This has test uniqueness')).toBeInTheDocument();
    });

    // Check extraction status
    expect(screen.getByText('Latar Belakang: ✓')).toBeInTheDocument();
    expect(screen.getByText('Tujuan Inovasi: ✗')).toBeInTheDocument();
    expect(screen.getByText('Deskripsi Inovasi: ✓')).toBeInTheDocument();
  });

  it('handles upload errors gracefully', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockRejectedValueOnce(new Error('Upload failed'));

    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i);
    const fileInput = screen.getByLabelText(/upload pdf/i);
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Fill and submit form
    await user.type(titleInput, 'Test Innovation');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);
    await user.click(uploadButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    // Form should be re-enabled
    expect(uploadButton).not.toBeDisabled();
    expect(titleInput).not.toBeDisabled();
    expect(fileInput).not.toBeDisabled();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Try to submit empty form
    await user.click(uploadButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/both title and a pdf file are required/i)).toBeInTheDocument();
  });

  it('calls callbacks after successful upload', async () => {
    const user = userEvent.setup();
    
    const mockResponse = {
      status: 'success',
      innovation_id: 'test_id',
      ai_summary: {
        ringkasan_singkat: 'Test summary',
        masalah_yang_diatasi: 'Test problem',
        solusi_yang_ditawarkan: 'Test solution',
        potensi_manfaat: 'Test benefits',
        keunikan_inovasi: 'Test uniqueness'
      },
      extracted_sections: {
        latar_belakang: '✓',
        tujuan_inovasi: '✓',
        deskripsi_inovasi: '✓'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i);
    const fileInput = screen.getByLabelText(/upload pdf/i);
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Fill and submit form
    await user.type(titleInput, 'Test Innovation');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);
    await user.click(uploadButton);

    // Wait for callbacks to be called
    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalledWith({
        innovation_id: 'test_id',
        judul_inovasi: 'Test Innovation',
        extracted_sections: mockResponse.extracted_sections,
        lsa_similarity_results: []
      });
      expect(mockOnUpdateInnovationList).toHaveBeenCalled();
    });
  });

  it('resets form after successful upload', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        innovation_id: 'test_id',
        ai_summary: {
          ringkasan_singkat: 'Test summary',
          masalah_yang_diatasi: 'Test problem',
          solusi_yang_ditawarkan: 'Test solution',
          potensi_manfaat: 'Test benefits',
          keunikan_inovasi: 'Test uniqueness'
        },
        extracted_sections: {
          latar_belakang: '✓',
          tujuan_inovasi: '✓',
          deskripsi_inovasi: '✓'
        }
      })
    });

    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
        onUpdateInnovationList={mockOnUpdateInnovationList}
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i) as HTMLInputElement;
    const fileInput = screen.getByLabelText(/upload pdf/i) as HTMLInputElement;
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Fill and submit form
    await user.type(titleInput, 'Test Innovation');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, file);
    await user.click(uploadButton);

    // Wait for upload to complete and form to reset
    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(fileInput.value).toBe('');
      expect(uploadButton).toBeDisabled();
    });
  });
});
