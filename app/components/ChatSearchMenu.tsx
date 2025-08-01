import React, { useState, useEffect, type FC, type FormEvent } from 'react';
import type { User, Innovation } from '../types';

const ChatSearchMenu: FC<{ user: User, innovationIds: string[], innovationDetails: Innovation[] }> = ({ user, innovationIds, innovationDetails }) => {
  const [id, setId] = useState(innovationIds[0] || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setId(innovationIds[0] || ''); }, [innovationIds]);
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setResults([]); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('search_query', query);
      formData.append('innovation_id', id);
      const res = await fetch('http://localhost:8000/chat/search', {
        method: 'POST',
        headers: { 'X-Inovator': user.name },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to search chat.');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="card">
      <h2>Search Chat</h2>
      <form onSubmit={handleSearch} style={{marginBottom: 16}}>
        <select value={id} onChange={e => setId(e.target.value)} style={{marginRight: 8}}>
          {innovationIds.map(iid => {
            const found = innovationDetails.find(inv => inv.innovation_id === iid);
            return <option key={iid} value={iid}>{found?.judul_inovasi || iid}</option>;
          })}
        </select>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search query" style={{marginRight: 8}} />
        <button type="submit" disabled={loading || !query}>{loading ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {results.length > 0 && (
        <ul>{results.map((r, i) => <li key={i}><b>Q:</b> {r.user_question}<br/><b>A:</b> {r.ai_response}</li>)}</ul>
      )}
    </div>
  );
};

export default ChatSearchMenu;
