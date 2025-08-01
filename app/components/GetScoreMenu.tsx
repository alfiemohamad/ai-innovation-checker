import React, { useState, useEffect, type FC, type FormEvent } from 'react';
import type { User, Innovation } from '../types';

// Import PDFPreview component
const PDFPreview: FC<{ url: string, width?: string, height?: string, style?: React.CSSProperties }> = ({ 
    url, 
    width = "100%", 
    height = "400px", 
    style = {} 
}) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPreview = async () => {
            if (!url) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Download file and create blob URL for preview
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch file');
                }
                
                // Check content length to avoid downloading huge files
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
                    throw new Error('File too large for preview (>50MB)');
                }
                
                const blob = await response.blob();
                
                // Check if it's actually a PDF
                if (!blob.type.includes('pdf') && !url.toLowerCase().includes('.pdf')) {
                    throw new Error('File does not appear to be a PDF');
                }
                
                const blobUrl = URL.createObjectURL(blob);
                setPreviewUrl(blobUrl);
            } catch (err: any) {
                setError(err.message || 'Failed to load PDF preview');
            } finally {
                setLoading(false);
            }
        };

        loadPreview();

        // Cleanup function to revoke blob URL
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [url]);

    if (loading) {
        return (
            <div className="pdf-preview-loading" style={{ ...style, width, height, padding: '2rem', border: '1px solid #333', borderRadius: 8 }}>
                <div className="spinner"></div>
                <p>Loading PDF preview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pdf-preview-error" style={{ ...style, width, height, padding: '2rem', border: '1px solid #333', borderRadius: 8 }}>
                <p>⚠️ Error loading PDF</p>
                <p>{error}</p>
            </div>
        );
    }

    if (!previewUrl) {
        return (
            <div style={{ ...style, width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333', borderRadius: 8 }}>
                <p>No PDF preview available.</p>
            </div>
        );
    }

    return (
        <iframe
            src={previewUrl}
            title="PDF Preview"
            width={width}
            height={height}
            style={{ ...style, border: '1px solid #333', borderRadius: 8 }}
        />
    );
};

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
            <PDFPreview 
                url={result.link_document} 
                height="400px"
            />
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
                    <details style={{marginTop: 8}}>
                      <summary style={{cursor: 'pointer', color: '#2e7dff'}}>Preview Document</summary>
                      <div style={{marginTop: 8}}>
                        <PDFPreview 
                          url={item.link_document} 
                          height="300px"
                        />
                      </div>
                    </details>
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
