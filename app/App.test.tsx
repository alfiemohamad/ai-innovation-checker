import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
  });

  it('shows sidebar and floating chatbot after login', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
    expect(screen.getByLabelText(/Upload Innovation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle sidebar/i)).toBeInTheDocument();
    // Floating chatbot button
    expect(screen.getByRole('button', { name: /chatbot/i })).toBeInTheDocument();
  });

  it('can open and close floating chatbot', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /chatbot/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /chatbot/i }));
    await waitFor(() => expect(screen.getByText(/Chat with AI/i)).toBeInTheDocument());
    // Close chatbot
    fireEvent.click(screen.getByLabelText(/close chatbot/i));
    await waitFor(() => expect(screen.queryByText(/Chat with AI/i)).not.toBeInTheDocument());
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
    fireEvent.change(screen.getByLabelText(/Judul Inovasi/i), { target: { value: 'Inovasi Hebat' } });
    // Mock file input
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload PDF/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Mock fetch for upload
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ innovation_id: 'dummyid', judul_inovasi: 'Inovasi Hebat' }),
      })
    );
    // Use getAllByRole to disambiguate sidebar vs. form button
    const uploadButtons = screen.getAllByRole('button', { name: /upload/i });
    // The form submit is likely the second button
    fireEvent.click(uploadButtons[1]);
    await waitFor(() => expect(screen.getByTestId('upload-success-message')).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/failed to upload/i)).toBeTruthy());
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

  it('can open user profile modal', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByTitle('Profile')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Profile'));
    await waitFor(() => expect(screen.getByText(/User Profile/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/Close modal/i));
    await waitFor(() => expect(screen.queryByText(/User Profile/i)).not.toBeInTheDocument());
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
      expect(scoreElement).toBeTruthy();
    });
  });

  it('shows analytics result and error handling', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByLabelText(/Analytics/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/Analytics/i));
    // Mock fetch for analytics success
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ chat_count: 5, top_questions: ["Apa itu?"] }),
      })
    );
    fireEvent.click(screen.getByRole('button', { name: /Get Analytics/i }));
    await waitFor(() => {
      // Result is rendered in a <pre>
      const pre = screen.getByText((content, node) => node?.tagName === 'PRE' && /chat_count/.test(content));
      expect(pre).toBeTruthy();
      expect(pre).toHaveTextContent(/chat_count/);
      expect(pre).toHaveTextContent(/5/);
    });
    // Mock fetch for analytics error
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ detail: 'Failed to get analytics.' }) })
    );
    fireEvent.click(screen.getByRole('button', { name: /Get Analytics/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to get analytics/i)).toBeTruthy();
    });
  });
});
