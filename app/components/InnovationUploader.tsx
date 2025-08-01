import React, { useState, type FC, type FormEvent } from 'react';
import type { User, Innovation } from '../types';

const InnovationUploader: FC<{ user: User, onUploadSuccess: (innovation: Innovation) => void }> = ({ user, onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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

        const formData = new FormData();
        formData.append('judul_inovasi', title);
        formData.append('file', file);
        try {
            const response = await fetch('http://localhost:8000/innovations/', {
                method: 'POST',
                headers: { 'X-Inovator': user.name },
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to upload innovation.');
            const result = await response.json();
            onUploadSuccess(result);
            setSuccess('Inovasi berhasil diupload!');
            setTitle('');
            setFile(null);
            (document.getElementById('file-upload') as HTMLInputElement).value = '';
        } catch (err: any) {
            setError(err.message || 'Failed to upload innovation.');
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
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="file-upload">Upload PDF</label>
                    <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileChange}
                        accept=".pdf"
                    />
                </div>
                <button type="submit" aria-label="Upload Innovation" disabled={!title || !file}>
                    Upload
                </button>
                {error && <p className="error-message">{error}</p>}
                {success && (
                    <p className="success-message" data-testid="upload-success-message">{success}</p>
                )}
            </form>
        </div>
    );
};

export default InnovationUploader;
