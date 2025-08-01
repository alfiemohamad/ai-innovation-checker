import React, { useState, useEffect, type FC } from 'react';
import type { Innovation } from '../types';

const InnovationList: FC<{
  onSelect: (inv: Innovation) => void,
  innovationIds?: string[],
  setInnovationDetails?: (details: Innovation[]) => void
}> = ({ onSelect, innovationIds, setInnovationDetails }) => {
  const [innovationDetails, setLocalInnovationDetails] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!innovationIds || innovationIds.length === 0) {
        setLocalInnovationDetails([]);
        if (setInnovationDetails) setInnovationDetails([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const details = await Promise.all(
          innovationIds.map(async (id) => {
            try {
              const res = await fetch(`http://localhost:8000/innovations/${id}/summary`);
              if (!res.ok) throw new Error('Failed to fetch summary');
              return await res.json();
            } catch {
              return null;
            }
          })
        );
        const filtered = details.filter(Boolean) as Innovation[];
        setLocalInnovationDetails(filtered);
        if (setInnovationDetails) setInnovationDetails(filtered);
      } catch (err: any) {
        setError('Failed to fetch innovation details.');
        if (setInnovationDetails) setInnovationDetails([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [innovationIds, setInnovationDetails]);

  if (loading) return <div className="card"><h2>My Innovations</h2><div>Loading...</div></div>;
  if (error) return <div className="card"><h2>My Innovations</h2><p className="error-message">{error}</p></div>;

  return (
    <div className="card">
      <h2>My Innovations</h2>
      {innovationDetails.length === 0 ? (
        <p>No innovations uploaded yet.</p>
      ) : (
        <ul>
          {innovationDetails.map(inv => (
            <li key={inv.innovation_id} className="innovation-item">
              <span className="innovation-item-title">{inv.judul_inovasi || inv.innovation_id}</span>
              <button onClick={() => onSelect(inv)}>View Details & Score</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InnovationList;
