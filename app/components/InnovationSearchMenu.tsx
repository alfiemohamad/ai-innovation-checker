import React, { useState, type FC, type FormEvent } from 'react';
import type { User } from '../types';

interface SearchResult {
  id: string;
  nama_inovasi: string;
  nama_inovator: string;
  latar_belakang: string;
  tujuan_inovasi: string;
  deskripsi_inovasi: string;
  link_document: string;
  similarity: number;
}

interface SearchResponse {
  query: string;
  top_innovation: SearchResult;
  ai_explanation: string;
  results: SearchResult[];
}

const InnovationSearchMenu: FC<{ user: User }> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);
    setSearchResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('table_name', 'innovations');

      const res = await fetch('http://localhost:8000/search_inovasi', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'X-Inovator': user.name,
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to search innovations');
      }

      const data: SearchResponse = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search innovations');
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="card">
      <h2>Innovation Search</h2>
      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary-color)' }}>
        Search for innovations using natural language queries. AI will find the most relevant innovations and explain them.
      </p>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="search-query">Search Query</label>
          <input
            type="text"
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., saya ingin mengetahui apakah ada inovasi yang memanfaatkan IoT"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search Innovations'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {searchResult && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Search Results for: "{searchResult.query}"</h3>
          
          {/* AI Explanation */}
          <div style={{ 
            background: '#23272f', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginBottom: '2rem',
            borderLeft: '4px solid var(--primary-color)'
          }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>🤖 AI Explanation</h4>
            <div style={{ lineHeight: '1.6' }}>{formatText(searchResult.ai_explanation)}</div>
          </div>

          {/* Top Innovation */}
          {searchResult.top_innovation && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--success-color)' }}>🏆 Most Relevant Innovation</h4>
              <div style={{ 
                background: '#2c2c2c', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '2px solid var(--success-color)'
              }}>
                <h5 style={{ 
                  color: 'var(--primary-color)', 
                  marginBottom: '0.5rem',
                  textTransform: 'capitalize'
                }}>
                  {searchResult.top_innovation.nama_inovasi.replace(/_/g, ' ')}
                </h5>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Innovator:</strong> {searchResult.top_innovation.nama_inovator}
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong>Similarity:</strong> {(searchResult.top_innovation.similarity * 100).toFixed(1)}%
                </p>
                
                <details style={{ marginBottom: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    Background
                  </summary>
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    {formatText(searchResult.top_innovation.latar_belakang)}
                  </div>
                </details>

                {searchResult.top_innovation.tujuan_inovasi && searchResult.top_innovation.tujuan_inovasi !== "TIDAK DITEMUKAN" && (
                  <details style={{ marginBottom: '1rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      Innovation Goals
                    </summary>
                    <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                      {formatText(searchResult.top_innovation.tujuan_inovasi)}
                    </div>
                  </details>
                )}

                <details style={{ marginBottom: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    Innovation Description
                  </summary>
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    {formatText(searchResult.top_innovation.deskripsi_inovasi)}
                  </div>
                </details>

                <a 
                  href={searchResult.top_innovation.link_document} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: 'var(--primary-color)', 
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  📄 View Document
                </a>
              </div>
            </div>
          )}

          {/* All Results */}
          <div>
            <h4 style={{ marginBottom: '1rem' }}>📋 All Search Results ({searchResult.results.length})</h4>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {searchResult.results.map((result, index) => (
                <div 
                  key={`${result.id}-${index}`}
                  style={{ 
                    background: '#2c2c2c', 
                    padding: '1rem', 
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <h5 style={{ 
                    color: 'var(--primary-color)', 
                    marginBottom: '0.5rem',
                    textTransform: 'capitalize'
                  }}>
                    {result.nama_inovasi.replace(/_/g, ' ')}
                  </h5>
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>By:</strong> {result.nama_inovator} | 
                    <strong> Similarity:</strong> {(result.similarity * 100).toFixed(1)}%
                  </p>
                  <p style={{ 
                    color: 'var(--text-secondary-color)', 
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>
                    {result.latar_belakang.slice(0, 200)}...
                  </p>
                  <a 
                    href={result.link_document} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: 'var(--primary-color)', 
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    📄 View Document
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InnovationSearchMenu;
