import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import App from './index';

// Mock fetch globally
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: () => Promise.resolve({ innovation_ids: ["dummyid"], summary: "Ringkasan", answer: "Jawaban AI" }),
      text: () => Promise.resolve(''),
    } as unknown as Response)
  );
});

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: () => Promise.resolve({ innovation_ids: ["dummyid"], summary: "Ringkasan", answer: "Jawaban AI" }),
      text: () => Promise.resolve(''),
    } as unknown as Response)
  );
});

describe('AI Innovation Checker Frontend', () => {
  it('renders login and allows login', async () => {
    render(<App />);
    expect(screen.getByText(/AI Innovation Checker/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    // After login, we should see the sidebar instead of "Dashboard"
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
  });

  it('shows sidebar and floating chatbot after login', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
    expect(screen.getByLabelText(/Sidebar: Upload Innovation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle sidebar/i)).toBeInTheDocument();
    // Floating chatbot button - check by title instead of role
    expect(screen.getByTitle(/Open Chatbot/i)).toBeInTheDocument();
  });

  it('can open and close floating chatbot', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByTitle(/Open Chatbot/i)).toBeInTheDocument());
    fireEvent.click(screen.getByTitle(/Open Chatbot/i));
    // Check if chatbot modal opened by looking for its header
    await waitFor(() => expect(screen.getByText(/AI Innovation Chatbot/i)).toBeInTheDocument());
    // Close chatbot
    fireEvent.click(screen.getByLabelText(/Close/i));
    await waitFor(() => expect(screen.queryByText(/AI Innovation Chatbot/i)).not.toBeInTheDocument());
  });

  it('can upload innovation and see success message', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText('Sidebar: Upload Innovation')).toBeInTheDocument());
    // Go to Upload Innovation menu
    fireEvent.click(screen.getByLabelText('Sidebar: Upload Innovation'));
    // Fill form
    fireEvent.change(screen.getByLabelText(/Judul Inovasi/i), { target: { value: 'Smart Irrigation System' } });
    // Mock file input
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload PDF/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Mock fetch for upload success with proper structure
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          code: 200,
          table: 'innovations',
          innovation_id: 'test-id-123',
          extracted_sections: {
            latar_belakang: '✓',
            tujuan_inovasi: '✓',
            deskripsi_inovasi: '✓'
          },
          ai_summary: {
            ringkasan_singkat: 'Sistem irigasi pintar untuk pertanian modern yang menggunakan sensor IoT',
            masalah_yang_diatasi: 'Kekurangan air pada tanaman dan pemborosan air dalam sistem irigasi tradisional',
            solusi_yang_ditawarkan: 'Otomatisasi sistem irigasi berbasis sensor kelembaban tanah dan cuaca',
            potensi_manfaat: 'Menghemat air hingga 40% dan meningkatkan hasil panen hingga 25%',
            keunikan_inovasi: 'Integrasi sensor IoT, AI, dan sistem kontrol otomatis dalam satu platform'
          }
        })
      })
    );
    // Use getAllByRole to disambiguate sidebar vs. form button
    const uploadButtons = screen.getAllByRole('button', { name: /upload/i });
    // The form submit is likely the second button (first is sidebar)
    fireEvent.click(uploadButtons[1]);
    // Wait for success message to appear
    await waitFor(() => {
      expect(screen.getByText(/berhasil diupload/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error on failed upload', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText('Sidebar: Upload Innovation')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Sidebar: Upload Innovation'));
    fireEvent.change(screen.getByLabelText(/Judul Inovasi/i), { target: { value: 'Inovasi Gagal' } });
    const file = new File(['dummy content'], 'fail.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload PDF/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Mock fetch for upload fail
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({ detail: 'Failed to upload innovation.' }) })
    );
    // Use getAllByRole to disambiguate sidebar vs. form button
    const uploadButtonsFail = screen.getAllByRole('button', { name: /upload/i });
    fireEvent.click(uploadButtonsFail[1]);
    await waitFor(() => expect(screen.getByText(/failed to upload/i)).toBeInTheDocument());
  });

  it('can open sidebar and collapse it', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText(/Toggle sidebar/i)).toBeInTheDocument());
    const collapseBtn = screen.getByLabelText(/Toggle sidebar/i);
    fireEvent.click(collapseBtn);
    expect(document.querySelector('.sidebar-menu.collapsed')).toBeTruthy();
    fireEvent.click(collapseBtn);
    expect(document.querySelector('.sidebar-menu.collapsed')).toBeFalsy();
  });

  it('shows get score dashboard result', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText(/Get Score/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/Get Score/i));
    // Mock fetch for get_score
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ total: 88, component_scores: { substansi_orisinalitas: 10 } }),
      })
    );
    // Use getAllByRole to disambiguate sidebar vs. form button
    const getScoreButtons = screen.getAllByRole('button', { name: /Get Score/i });
    // The form submit is likely the second button
    fireEvent.click(getScoreButtons[1]);
    await waitFor(() => {
      // Find an element that contains 'Total Score: 88' (robust to whitespace)
      const scoreElement = screen.getByText(/Total Score:\s*88/i);
      expect(scoreElement).toBeInTheDocument();
    });
  });

  it('can navigate to Innovation Search', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText(/Innovation Search/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/Innovation Search/i));
    // Should show search interface - the h2 already contains "Innovation Search"
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Innovation Search/i })).toBeInTheDocument();
    });
  });

  it('can navigate to Innovation Ranking', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText(/Ranking Inovasi/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/Ranking Inovasi/i));
    // Should show ranking interface - looking for "Ranking Inovasi" instead of "Innovation Rankings"
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ranking Inovasi/i })).toBeInTheDocument();
    });
  });
});
