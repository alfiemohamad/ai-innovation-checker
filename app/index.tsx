import React, { useState, useEffect, useCallback, FC, FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { FaUpload, FaList, FaChartBar, FaSearch, FaStar, FaUserCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// --- TYPE DEFINITIONS (based on API Spec) ---

interface User {
    name: string;
}

interface ExtractedSections {
    latar_belakang?: '✓' | '✗';
    tujuan_inovasi?: '✓' | '✗';
    deskripsi_inovasi?: '✓' | '✗';
}

interface LsaSimilarityResult {
    lsa_similarity: number;
    link_document: string;
}

interface Innovation {
    innovation_id: string;
    judul_inovasi: string;
    extracted_sections: ExtractedSections;
    lsa_similarity_results: LsaSimilarityResult[];
}

interface Score {
    substansi_orisinalitas: number;
    substansi_urgensi: number;
    substansi_kedalaman: number;
    analisis_dampak: number;
    analisis_kelayakan: number;
    analisis_data: number;
    sistematika_struktur: number;
    sistematika_bahasa: number;
    sistematika_referensi: number;
    total: number;
}

interface Summary {
    summary: string;
}

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

// --- API HELPER FUNCTIONS ---
const API_BASE_URL = 'http://localhost:8000'; // Pastikan path endpoint backend benar

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
};


// --- UI COMPONENTS ---

const Spinner: FC = () => <div className="spinner"></div>;


interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Username and password are required.');
            return;
        }
        setError(null);
        // Simulate login, as no auth endpoint is specified.
        // In a real app, you would call a login API here.
        setTimeout(() => {
            console.log(`Simulating login for user: ${username}`);
            onLogin({ name: username });
        }, 500);
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>AI Innovation Checker</h1>
                <div className="form-group">
                    <label htmlFor="username">Username (Innovator Name)</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        aria-label="Username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label="Password"
                    />
                </div>
                <button type="submit" style={{ width: '100%' }}>
                    Login
                </button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};


// --- Sidebar Menu ---
const MENU = [
  { key: 'upload', label: 'Upload Innovation', icon: <FaUpload /> },
  { key: 'my_innovations', label: 'My Innovations', icon: <FaList /> },
  { key: 'get_score', label: 'Get Score', icon: <FaStar /> },
  { key: 'chat_search', label: 'Chat Search', icon: <FaSearch /> },
  { key: 'analytics', label: 'Analytics', icon: <FaChartBar /> },
];

const SidebarMenu: FC<{ active: string, setActive: (k: string) => void }> = ({ active, setActive }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <nav className={`sidebar-menu${collapsed ? ' collapsed' : ''}`}>  
      <div className="sidebar-header">
        <FaUserCircle size={32} style={{ marginRight: collapsed ? 0 : 12 }} />
        {!collapsed && <span style={{ fontWeight: 600 }}>Menu</span>}
        <button
          className="sidebar-collapse-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      <ul>
        {MENU.map(m => (
          <li key={m.key}>
            <button
              className={active === m.key ? 'active' : ''}
              onClick={() => setActive(m.key)}
              title={m.label}
            >
              <span className="sidebar-icon">{m.icon}</span>
              {!collapsed && <span className="sidebar-label">{m.label}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// --- Innovation Uploader ---
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
            const result = await apiRequest('/innovations/', {
                method: 'POST',
                headers: { 'X-Inovator': user.name },
                body: formData,
            });
            onUploadSuccess(result);
            setSuccess(`Innovation "${title}" uploaded successfully!`);
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
                    <label htmlFor="title">Innovation Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Smart Irrigation System"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="file-upload">PDF Document</label>
                    <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileChange}
                        accept=".pdf"
                    />
                </div>
                <button type="submit" disabled={!title || !file}>
                    Upload
                    {/* {isLoading && <ButtonSpinner />} */}
                </button>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
            </form>
        </div>
    );
};

// --- Innovation List ---
const InnovationList: FC<{ onSelect: (inv: Innovation) => void, innovationIds?: string[], setInnovationDetails?: (details: Innovation[]) => void }> = ({ onSelect, innovationIds, setInnovationDetails }) => {
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
              return await apiRequest(`/innovations/${id}/summary`);
            } catch {
              return null;
            }
          })
        );
        const filtered = details.filter(Boolean);
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

  if (loading) return <div className="card"><h2>My Innovations</h2><Spinner /></div>;
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

// --- Get Score Menu ---
const GetScoreMenu: FC<{ user: User, innovationIds: string[], innovationDetails: Innovation[] }> = ({ user, innovationIds, innovationDetails }) => {
  const [id, setId] = useState(innovationIds[0] || '');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setId(innovationIds[0] || ''); }, [innovationIds]);
  const handleGetScore = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setResult(null); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', id);
      const res = await apiRequest('/get_score', { method: 'POST', headers: { 'X-Inovator': user.name }, body: formData });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };
  return (
    <div className="card">
      <h2>Get Score by Innovation ID</h2>
      <form onSubmit={handleGetScore} style={{marginBottom: 16}}>
        <select value={id} onChange={e => setId(e.target.value)} style={{marginRight: 8}}>
          {innovationIds.map((iid, idx) => {
            const found = innovationDetails.find(inv => inv.innovation_id === iid);
            return <option key={iid} value={iid}>{found?.judul_inovasi || iid}</option>;
          })}
        </select>
        <button type="submit" disabled={loading || !id}>{loading ? 'Loading...' : 'Get Score'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {result && <pre style={{whiteSpace:'pre-wrap', background:'#222', color:'#fff', padding:8, borderRadius:4}}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

// --- Chat Search Menu ---
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
      const res = await apiRequest('/chat/search', { method: 'POST', headers: { 'X-Inovator': user.name }, body: formData });
      setResults(res.results || []);
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

// --- Analytics Menu ---
const AnalyticsMenu: FC<{ user: User, innovationIds: string[], innovationDetails: Innovation[] }> = ({ user, innovationIds, innovationDetails }) => {
  const [id, setId] = useState(innovationIds[0] || '');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setId(innovationIds[0] || ''); }, [innovationIds]);
  const handleGetAnalytics = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setResult(null); setLoading(true);
    try {
      const res = await apiRequest(`/innovations/${id}/chat_analytics`, { headers: { 'X-Inovator': user.name } });
      setResult(res);
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
        <button type="submit" disabled={loading || !id}>{loading ? 'Loading...' : 'Get Analytics'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {result && <pre style={{whiteSpace:'pre-wrap', background:'#222', color:'#fff', padding:8, borderRadius:4}}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

// --- Detail Modal ---
interface DetailModalProps {
    user: User;
    innovation: Innovation;
    onClose: () => void;
}

const DetailModal: FC<DetailModalProps> = ({ user, innovation, onClose }) => {
    type Tab = 'score' | 'similarity' | 'summary' | 'chat' | 'analytics' | 'chat_summary';
    const [activeTab, setActiveTab] = useState<Tab>('score');
    const [score, setScore] = useState<Score | null>(null);
    const [scoreResponse, setScoreResponse] = useState<any>(null); // Untuk menyimpan response get_score mentah
    const [summary, setSummary] = useState<Summary | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatQuestion, setChatQuestion] = useState('');
    const [analytics, setAnalytics] = useState<any>(null);
    const [chatSummary, setChatSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<Record<Tab, boolean>>({ score: false, similarity: false, summary: false, chat: false, analytics: false, chat_summary: false });
    const [error, setError] = useState<string | null>(null);
    
    const fetchDataForTab = useCallback(async (tab: Tab) => {
        if (isLoading[tab]) return;
        setIsLoading(prev => ({...prev, [tab]: true}));
        setError(null);
        try {
            const headers = { 'X-Inovator': user.name };
            const id = innovation.innovation_id;
            if (tab === 'score' && !score) {
                const formData = new FormData();
                formData.append('id', id);
                const scoreData = await apiRequest('/get_score', { method: 'POST', headers, body: formData });
                setScore(scoreData.component_scores || null);
                setScoreResponse(scoreData); // Simpan seluruh response
            } else if (tab === 'summary' && !summary) {
                const summaryData = await apiRequest(`/innovations/${id}/summary`, { headers });
                setSummary(summaryData);
            } else if (tab === 'chat' && chatHistory.length === 0) {
                const historyData = await apiRequest(`/innovations/${id}/chat_history`, { headers });
                const formattedHistory: ChatMessage[] = historyData.flatMap((item: any) => [
                    { role: 'user', content: item.question },
                    { role: 'ai', content: item.answer },
                ]);
                setChatHistory(formattedHistory);
            } else if (tab === 'analytics' && !analytics) {
                const analyticsData = await apiRequest(`/innovations/${id}/chat_analytics`, { headers });
                setAnalytics(analyticsData);
            } else if (tab === 'chat_summary' && !chatSummary) {
                const summaryData = await apiRequest(`/users/${user.name}/chat_summary`, { headers });
                setChatSummary(summaryData.summary || JSON.stringify(summaryData));
            }
        } catch(err: any) {
            setError(`Failed to load ${tab} data: ${err.message}`);
        } finally {
            setIsLoading(prev => ({...prev, [tab]: false}));
        }
    }, [user.name, innovation.innovation_id, score, summary, chatHistory, analytics, chatSummary, isLoading]);

    useEffect(() => {
        fetchDataForTab(activeTab);
    }, [activeTab, fetchDataForTab]);

    const handleChatSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!chatQuestion.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: chatQuestion };
        setChatHistory(prev => [...prev, userMessage]);
        setChatQuestion('');
        setIsLoading(prev => ({...prev, chat: true}));
        
        const formData = new FormData();
        formData.append('question', chatQuestion);
        
        try {
            const res = await apiRequest(`/innovations/${innovation.innovation_id}/chat`, {
                method: 'POST',
                headers: { 'X-Inovator': user.name },
                body: formData,
            });
            const aiMessage: ChatMessage = { role: 'ai', content: res.answer };
            setChatHistory(prev => [...prev, aiMessage]);
        } catch (err: any) {
            setError(`Chat error: ${err.message}`);
            setChatHistory(prev => prev.slice(0, -1)); // Remove user message on error
        } finally {
            setIsLoading(prev => ({...prev, chat: false}));
        }
    };
    
    const renderTabContent = () => {
        if (isLoading[activeTab]) return <Spinner />;
        if (error) return <p className="error-message">{error}</p>;
        switch(activeTab) {
            case 'score':
                return score && scoreResponse ? (
                    <div>
                        <div style={{marginBottom: '1.5rem'}}>
                            <h3>Preview PDF</h3>
                            {scoreResponse.link_document ? (
                                <iframe
                                    src={scoreResponse.link_document}
                                    title="PDF Preview"
                                    width="100%"
                                    height="500px"
                                    style={{border: '1px solid #333', borderRadius: 8}}
                                />
                            ) : (
                                <p>No PDF preview available.</p>
                            )}
                        </div>
                        <div className="score-grid">
                            {Object.entries(score).map(([key, value]) => (
                                <div key={key} className="score-item">
                                    <p>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                    <span>{value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{marginTop: '2rem'}}>
                            <h3>Plagiarism Check (LSA Similarity)</h3>
                            {scoreResponse.plagiarism_check && scoreResponse.plagiarism_check.length > 0 ? (
                                <ul>
                                    {scoreResponse.plagiarism_check.map((item: any, idx: number) => (
                                        <li key={idx} style={{marginBottom: 8}}>
                                            <strong>Score:</strong> {item.similarity_score} | <strong>By:</strong> {item.nama_inovator} <br/>
                                            <a href={item.link_document} target="_blank" rel="noopener noreferrer">Preview Document</a>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p>No plagiarism check results.</p>}
                        </div>
                    </div>
                ) : <p>No score data available.</p>;
            case 'similarity':
                return innovation.lsa_similarity_results?.length > 0 ? (
                    <div>
                        {innovation.lsa_similarity_results.map((sim, index) => (
                            <div key={index} className="similarity-item">
                                <p><strong>Similarity:</strong> {(sim.lsa_similarity * 100).toFixed(2)}%</p>
                                <p><strong>Document:</strong> <a href={sim.link_document} target="_blank" rel="noopener noreferrer">{sim.link_document}</a></p>
                            </div>
                        ))}
                    </div>
                ) : <p>No similarity results found.</p>;
            case 'summary':
                return summary ? <div><p>{summary.summary}</p></div> : <p>No summary available.</p>;
            case 'chat':
                return (
                    <div>
                        <div className="chat-history" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.role}`}>
                                    <p><strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatSubmit} className="chat-input-container">
                            <input
                                type="text"
                                value={chatQuestion}
                                onChange={(e) => setChatQuestion(e.target.value)}
                                placeholder="Ask about the innovation..."
                                disabled={isLoading.chat}
                            />
                            <button type="submit" disabled={isLoading.chat}>Send</button>
                        </form>
                    </div>
                );
            case 'analytics':
                return analytics ? (
                    <div>
                        <h3>Chat Analytics</h3>
                        {analytics.common_words && (
                            <div>
                                <strong>Most Common Words:</strong>
                                <ul>
                                    {analytics.common_words.map((w: any, i: number) => (
                                        <li key={i}>{w.word} ({w.frequency})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analytics.total_questions !== undefined && (
                            <p><strong>Total Questions:</strong> {analytics.total_questions}</p>
                        )}
                        {analytics.unique_users && (
                            <p><strong>Unique Users:</strong> {analytics.unique_users}</p>
                        )}
                    </div>
                ) : <p>No analytics data available.</p>;
            case 'chat_summary':
                return chatSummary ? (
                    <div>
                        <h3>Chat Summary</h3>
                        <p>{chatSummary}</p>
                    </div>
                ) : <p>No chat summary available.</p>;
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
                <div className="modal-header">
                    <h2>{innovation.judul_inovasi}</h2>
                </div>
                <div className="modal-tabs">
                    {(['score', 'similarity', 'summary', 'chat', 'analytics', 'chat_summary'] as Tab[]).map(tab => (
                        <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                            {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
                <div className="modal-body">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

// --- User Profile/Settings Modal ---
const UserProfileModal: FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
      <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
      <div className="modal-header"><h2>User Profile</h2></div>
      <div className="modal-body">
        <p><strong>Name:</strong> {user.name}</p>
        <p><em>More settings coming soon...</em></p>
      </div>
    </div>
  </div>
);

// --- Floating Chatbot Component ---
const FloatingChatbot: FC<{ user: User, innovationIds: string[], innovationDetails: Innovation[] }> = ({ user, innovationIds, innovationDetails }) => {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false); // NEW: maximize state
  const [selectedId, setSelectedId] = useState(innovationIds[0] || '');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setSelectedId(innovationIds[0] || ''); }, [innovationIds]);

  const sendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !selectedId) return;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('question', question);
      formData.append('table_name', 'innovations');
      const res = await apiRequest(`/innovations/${selectedId}/chat`, {
        method: 'POST',
        headers: { 'X-Inovator': user.name },
        body: formData
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
      setQuestion('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`floating-chatbot-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} title="Open Chatbot">
        <FaUserCircle size={28} />
        {!open && <span>Chat</span>}
      </div>
      {open && (
        <div className={`floating-chatbot-modal${maximized ? ' maximized' : ''}`}> {/* Add maximized class */}
          <div className="floating-chatbot-header">
            <span>AI Innovation Chatbot</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setMaximized(m => !m)}
                aria-label={maximized ? 'Minimize' : 'Maximize'}
                className="chatbot-maximize-btn"
                title={maximized ? 'Minimize' : 'Maximize'}
                style={{ fontSize: 18 }}
              >
                {maximized ? '🗗' : '🗖'}
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close" className="chatbot-close-btn">&times;</button>
            </div>
          </div>
          <div className="floating-chatbot-select">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {innovationIds.map(iid => {
                const found = innovationDetails.find(inv => inv.innovation_id === iid);
                return <option key={iid} value={iid}>{found?.judul_inovasi || iid}</option>;
              })}
            </select>
          </div>
          <div className="floating-chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`}>{msg.content}</div>
            ))}
            {loading && <div className="chatbot-msg ai">...</div>}
          </div>
          <form className="floating-chatbot-input" onSubmit={sendChat}>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Tulis pertanyaan..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !question.trim()}>Kirim</button>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </>
  );
};

// --- Main App Component ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('upload');
  const [innovationIds, setInnovationIds] = useState<string[]>([]);
  const [innovationDetails, setInnovationDetails] = useState<Innovation[]>([]);
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch innovation IDs from backend after login
  useEffect(() => {
    const fetchInnovationIds = async () => {
      if (!user) return;
      try {
        const res = await apiRequest(`/innovations/by_inovator?table_name=innovations`, {
          headers: { 'X-Inovator': user.name }
        });
        setInnovationIds(res.innovation_ids || []);
        // Optionally: fetch full innovation data for each ID here if needed
      } catch (err) {
        setInnovationIds([]);
      }
    };
    fetchInnovationIds();
  }, [user]);

  useEffect(() => {
    if (user) localStorage.setItem(`innovations_${user.name}`, JSON.stringify(innovationDetails));
  }, [innovationDetails, user]);

  const handleUploadSuccess = (newInnovation: Innovation) => {
    setInnovationDetails(prev => [newInnovation, ...prev]);
    setActiveMenu('my_innovations');
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <div className="main-layout">
      <SidebarMenu active={activeMenu} setActive={setActiveMenu} />
      <div className="main-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <button onClick={() => setShowProfile(true)} className="profile-btn" title="Profile"><FaUserCircle size={22} /></button>
            <button onClick={() => setUser(null)} className="secondary">Logout</button>
          </div>
        </div>
        {activeMenu === 'upload' && <InnovationUploader user={user!} onUploadSuccess={() => {}} />}
        {activeMenu === 'my_innovations' && <InnovationList onSelect={setSelectedInnovation} innovationIds={innovationIds} setInnovationDetails={setInnovationDetails} />}
        {activeMenu === 'get_score' && <GetScoreMenu user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />}
        {activeMenu === 'chat_search' && <ChatSearchMenu user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />}
        {activeMenu === 'analytics' && <AnalyticsMenu user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />}
        {selectedInnovation && (
          <DetailModal user={user!} innovation={selectedInnovation} onClose={() => setSelectedInnovation(null)} />
        )}
        {showProfile && <UserProfileModal user={user!} onClose={() => setShowProfile(false)} />}
        <FloatingChatbot user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;