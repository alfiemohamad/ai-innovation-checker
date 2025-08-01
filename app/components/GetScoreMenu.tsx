import React, { useState, useEffect, type FC, type FormEvent } from 'react';
import type { User, Innovation } from '../types';

const GetScoreMenu: FC<{ user: User, innovationIds: string[], innovationDetails: Innovation[] }> = ({ user, innovationIds, innovationDetails }) => {
  const [id, setId] = useState(innovationIds[0] || '');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setId(innovationIds[0] || ''); }, [innovationIds]);
  const handleGetScore = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setResult(null); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', id);
      const res = await fetch('http://localhost:8000/get_score', {
        method: 'POST',
        headers: { 'X-Inovator': user.name },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to get score.');
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };
  return (
    <div className="card">
      <h2>Get Score by Innovation ID</h2>
      <form onSubmit={handleGetScore} style={{marginBottom: 16}}>
        <select value={id} onChange={e => setId(e.target.value)} style={{marginRight: 8}}>
          {innovationIds.map((iid) => {
            const found = innovationDetails.find(inv => inv.innovation_id === iid);
            return <option key={iid} value={iid}>{found?.judul_inovasi || iid}</option>;
          })}
        </select>
        <button type="submit" aria-label="Get Score" disabled={loading || !id}>{loading ? 'Loading...' : 'Get Score'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {result && (
        <div style={{marginTop: 24}}>
          <h3 style={{marginBottom: 8}}>{result.nama_inovasi?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h3>
          <p style={{marginBottom: 4}}><b>Inovator:</b> {result.nama_inovator}</p>
          <div style={{marginBottom: 16}}>
            <b>Preview PDF:</b><br/>
            {result.link_document ? (
              <iframe
                src={result.link_document}
                title="PDF Preview"
                width="100%"
                height="400px"
                style={{border: '1px solid #333', borderRadius: 8, marginTop: 8}}
              />
            ) : <span>Tidak ada preview PDF.</span>}
          </div>
          <div className="score-grid" style={{marginBottom: 16}}>
            {result.component_scores && Object.entries(result.component_scores).map(([key, value]) => (
              <div key={key} className="score-item">
                <p>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize: 22, fontWeight: 700, color: '#2e7dff', marginBottom: 20}}>
            Total Score: {result.total_score ?? result.total}
          </div>
          <div style={{marginBottom: 8}}>
            <b>Plagiarism Check (LSA Similarity):</b>
            {result.plagiarism_check && result.plagiarism_check.length > 0 ? (
              <ul style={{marginTop: 8}}>
                {result.plagiarism_check.map((item: any, idx: number) => (
                  <li key={idx} style={{marginBottom: 8, background: '#23272f', borderRadius: 6, padding: 10}}>
                    <b>Score:</b> {(item.similarity_score * 100).toFixed(2)}% &nbsp;|&nbsp; <b>By:</b> {item.nama_inovator}<br/>
                    <a href={item.link_document} target="_blank" rel="noopener noreferrer">Preview Document</a>
                  </li>
                ))}
              </ul>
            ) : <p style={{margin: 0}}>No plagiarism check results.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default GetScoreMenu;
