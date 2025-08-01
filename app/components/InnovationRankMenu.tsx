import React, { useState, useEffect, type FC } from 'react';
import './InnovationRankMenu.css';

interface RankItem {
  innovation_id: string;
  substansi_orisinalitas: number;
  substansi_urgensi: number;
  substansi_kedalaman: number;
  analisis_dampak: number;
  analisis_kelayakan: number;
  created_at: string;
  total_score?: number;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
};

const InnovationRankMenu: FC = () => {
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8000/get_rank?table_name=innovations')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch ranking');
        return res.json();
      })
      .then(data => setRanking(data.ranking || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card rank-card">
      <h2 style={{display:'flex',alignItems:'center',gap:8}}>
        <span role="img" aria-label="Trophy" style={{fontSize:28}}>🏆</span>
        Ranking Inovasi
      </h2>
      {loading && <div>Loading...</div>}
      {error && <p className="error-message">{error}</p>}
      {ranking.length > 0 && (
        <div className="rank-table-wrapper">
          <table className="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Judul/ID</th>
                <th>Orisinalitas</th>
                <th>Urgensi</th>
                <th>Kedalaman</th>
                <th>Dampak</th>
                <th>Kelayakan</th>
                <th>Total</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, i) => (
                <tr key={item.innovation_id} className={i === 0 ? 'rank-top' : ''}>
                  <td style={{fontWeight:'bold'}}>{i+1}</td>
                  <td style={{maxWidth:220,wordBreak:'break-all'}}>{item.innovation_id}</td>
                  <td>{item.substansi_orisinalitas}</td>
                  <td>{item.substansi_urgensi}</td>
                  <td>{item.substansi_kedalaman}</td>
                  <td>{item.analisis_dampak}</td>
                  <td>{item.analisis_kelayakan}</td>
                  <td style={{fontWeight:'bold',color:'#1a7f37'}}>{item.total_score ?? '-'}</td>
                  <td>{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ranking.length === 0 && !loading && <div>Tidak ada data ranking.</div>}
    </div>
  );
};

export default InnovationRankMenu;
