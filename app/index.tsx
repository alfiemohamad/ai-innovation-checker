import { useState, useEffect, type FC, type FormEvent, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { FaUserCircle } from 'react-icons/fa';
import LoginPage from './components/LoginPage';
import SidebarMenu from './components/SidebarMenu';
import Spinner from './components/Spinner';
import UserProfileModal from './components/UserProfileModal';
import InnovationUploader from './components/InnovationUploader';
import InnovationList from './components/InnovationList';
import GetScoreMenu from './components/GetScoreMenu';
import ChatSearchMenu from './components/ChatSearchMenu';
import AnalyticsMenu from './components/AnalyticsMenu';
import type { User, Innovation, Score, Summary, ChatMessage } from './types';

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

// --- Sidebar Menu ---
// (removed local SidebarMenu definition)

// --- Innovation Uploader ---
// (moved to ./components/InnovationUploader.tsx)

// --- Innovation List ---
// (moved to ./components/InnovationList.tsx)

// --- Get Score Menu ---
// (moved to ./components/GetScoreMenu.tsx)

// --- Chat Search Menu ---
// (moved to ./components/ChatSearchMenu.tsx)

// --- Analytics Menu ---
// (moved to ./components/AnalyticsMenu.tsx)

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
            <button type="submit" aria-label="Send Chat">Kirim</button>
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
          headers: { 'X-Inovator': user?.name || '' }
        });
        setInnovationIds(res.innovation_ids || []);
      } catch (err) {
        console.error('Failed to fetch innovation IDs:', err);
      }
    };

    fetchInnovationIds();
  }, [user]);

  // Fetch innovation details for the first ID by default
  useEffect(() => {
    const fetchInnovationDetails = async () => {
      if (innovationIds.length === 0) return;
      try {
        const details = await Promise.all(
          innovationIds.map(id => apiRequest(`/innovations/${id}`, {
            headers: { 'X-Inovator': user?.name || '' }
          }))
        );
        setInnovationDetails(details);
        setSelectedInnovation(details[0] || null);
      } catch (err) {
        console.error('Failed to fetch innovation details:', err);
      }
    };

    fetchInnovationDetails();
  }, [innovationIds, user]);

  const handleUploadSuccess = (newInnovation: Innovation) => {
    setInnovationDetails(prev => [newInnovation, ...prev]);
    setActiveMenu('my_innovations');
  };

  return (
    <div className="app-container">
      {user === null ? (
        <LoginPage onLogin={setUser} />
      ) : (
        <>
          <SidebarMenu active={activeMenu} setActive={setActiveMenu} />
          <div className="main-content">
            <div className="header">
              <h1>AI Innovation Dashboard</h1>
              <div className="user-info" onClick={() => setShowProfile(true)} title="Profile">
                <FaUserCircle size={24} />
                <span>{user.name}</span>
              </div>
            </div>
            <div className="content-area">
              {activeMenu === 'upload' && <InnovationUploader user={user!} onUploadSuccess={handleUploadSuccess} />}
              {activeMenu === 'my_innovations' && <InnovationList onSelect={setSelectedInnovation} innovationIds={innovationIds} setInnovationDetails={setInnovationDetails} />}
              {activeMenu === 'get_score' && <GetScoreMenu user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />}
              {activeMenu === 'chat_search' && <ChatSearchMenu user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />}
              {activeMenu === 'analytics' && <AnalyticsMenu user={user!} innovationIds={innovationIds} innovationDetails={innovationDetails} />}
              {activeMenu === 'score' && selectedInnovation && (
                <DetailModal user={user} innovation={selectedInnovation} onClose={() => setSelectedInnovation(null)} />
              )}
            </div>
          </div>
          {showProfile && user && (
            <UserProfileModal
              user={user!}
              onClose={() => setShowProfile(false)}
            />
          )}
          <FloatingChatbot user={user} innovationIds={innovationIds} innovationDetails={innovationDetails} />
        </>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;