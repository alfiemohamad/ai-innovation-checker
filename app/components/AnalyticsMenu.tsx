import React, { useState, useEffect, type FC, type FormEvent } from 'react';
import type { User, Innovation } from '../types';

const AnalyticsMenu: FC<{ user: User, innovationIds: string[], innovationDetails: Innovation[] }> = ({ user, innovationIds, innovationDetails }) => {
  const [id, setId] = useState(innovationIds[0] || '');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setId(innovationIds[0] || ''); }, [innovationIds]);
  const handleGetAnalytics = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setResult(null); setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/innovations/${id}/chat_analytics`, { headers: { 'X-Inovator': user.name } });
      if (!res.ok) throw new Error('Failed to get analytics.');
      setResult(await res.json());
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="card">
      <h2>Chat Analytics by Innovation ID</h2>
      <form onSubmit={handleGetAnalytics} style={{marginBottom: 16}}>
        <select value={id} onChange={e => setId(e.target.value)} style={{marginRight: 8}}>
          {innovationIds.map(iid => {
            const found = innovationDetails.find(inv => inv.innovation_id === iid);
            return <option key={iid} value={iid}>{found?.judul_inovasi || iid}</option>;
          })}
        </select>
        <button type="submit" aria-label="Get Analytics" disabled={loading || !id}>{loading ? 'Loading...' : 'Get Analytics'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {result && <pre style={{whiteSpace:'pre-wrap', background:'#222', color:'#fff', padding:8, borderRadius:4}}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default AnalyticsMenu;
