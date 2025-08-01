import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InnovationUploader from '../../../components/InnovationUploader';
import type { User } from '../../../types';

const mockUser: User = { name: 'test_user' };
const mockOnUploadSuccess = vi.fn();

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

  it('validates required fields', () => {
    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /upload/i });

    // Button should be disabled when form is empty
    expect(uploadButton).toBeDisabled();
  });
});
