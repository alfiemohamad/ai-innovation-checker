import React, { useState, type FC, type FormEvent } from 'react';
import type { User, Innovation, UploadResponse } from '../types';

const InnovationUploader: FC<{ 
    user: User, 
    onUploadSuccess: (innovation: Innovation) => void
}> = ({ user, onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !file) {
            setError('Both title and a PDF file are required.');
            return;
        }
        
        setError(null);
        setSuccess(null);
        setUploadResult(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('judul_inovasi', title);
        formData.append('file', file);
        formData.append('table_name', 'innovations');
        
        try {
            const response = await fetch('http://localhost:8000/innovations/', {
                method: 'POST',
                headers: { 
                    'accept': 'application/json',
                    'X-Inovator': user.name 
                },
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to upload innovation.' }));
                throw new Error(errorData.detail || errorData.message || 'Failed to upload innovation.');
            }
            
            const result: UploadResponse = await response.json();
            setUploadResult(result);
            setSuccess('Inovasi berhasil diupload!');
            
            // Create Innovation object for compatibility
            const innovation: Innovation = {
                innovation_id: result.innovation_id,
                judul_inovasi: title,
                extracted_sections: result.extracted_sections,
                lsa_similarity_results: []
            };
            
            onUploadSuccess(innovation);
            
            // Reset form
            setTitle('');
            setFile(null);
            (document.getElementById('file-upload') as HTMLInputElement).value = '';
            
        } catch (err: any) {
            setError(err.message || 'Failed to upload innovation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Upload New Innovation</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Judul Inovasi</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Smart Irrigation System"
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="file-upload">Upload PDF</label>
                    <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileChange}
                        accept=".pdf"
                        disabled={loading}
                    />
                </div>
                <button 
                    type="submit" 
                    aria-label="Upload Innovation" 
                    disabled={!title || !file || loading}
                >
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
                
                {loading && (
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <p>📤 Sedang mengupload dan memproses dokumen...</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-color)' }}>
                            Mohon tunggu, sistem sedang menganalisis dokumen dengan AI
                        </p>
                    </div>
                )}
                
                {error && <p className="error-message">{error}</p>}
                
                {success && (
                    <div style={{ marginTop: '1rem' }}>
                        <p className="success-message" data-testid="upload-success-message">{success}</p>
                        
                        {uploadResult && (
                            <div style={{ 
                                marginTop: '1.5rem', 
                                padding: '1rem', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px',
                                backgroundColor: 'var(--card-bg-color)'
                            }}>
                                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>
                                    📋 Ringkasan AI
                                </h3>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>💡 Ringkasan Singkat:</h4>
                                    <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                                        {uploadResult.ai_summary.ringkasan_singkat}
                                    </p>
                                </div>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>❗ Masalah yang Diatasi:</h4>
                                    <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                                        {uploadResult.ai_summary.masalah_yang_diatasi}
                                    </p>
                                </div>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>🔧 Solusi yang Ditawarkan:</h4>
                                    <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                                        {uploadResult.ai_summary.solusi_yang_ditawarkan}
                                    </p>
                                </div>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>🚀 Potensi Manfaat:</h4>
                                    <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                                        {uploadResult.ai_summary.potensi_manfaat}
                                    </p>
                                </div>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>⭐ Keunikan Inovasi:</h4>
                                    <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
                                        {uploadResult.ai_summary.keunikan_inovasi}
                                    </p>
                                </div>
                                
                                <div style={{ 
                                    marginTop: '1rem', 
                                    padding: '0.75rem', 
                                    backgroundColor: 'var(--bg-color)', 
                                    borderRadius: '6px' 
                                }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>📊 Status Ekstraksi Bagian:</h4>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span>Latar Belakang: {uploadResult.extracted_sections.latar_belakang}</span>
                                        <span>Tujuan Inovasi: {uploadResult.extracted_sections.tujuan_inovasi}</span>
                                        <span>Deskripsi Inovasi: {uploadResult.extracted_sections.deskripsi_inovasi}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default InnovationUploader;
