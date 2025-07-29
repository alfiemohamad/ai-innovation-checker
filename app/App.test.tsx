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

describe('AI Innovation Checker Frontend', () => {
  it('renders login and allows login', async () => {
    render(<App />);
    expect(screen.getByText(/AI Innovation Checker/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByText(/Login/i));
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
  });

  it('shows sidebar and floating chatbot after login', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByText(/Login/i));
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(screen.getByText(/Upload Innovation/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat/i)).toBeInTheDocument();
  });

  it('can open and close floating chatbot', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByText(/Login/i));
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Open Chatbot'));
    expect(screen.getByText(/AI Innovation Chatbot/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText(/AI Innovation Chatbot/i)).not.toBeInTheDocument();
  });

  // Tambahkan test lain untuk upload, get score, chat, analytics agar coverage >90%
});
