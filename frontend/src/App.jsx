import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Moon, Sun, Loader2, Sparkles, User, Trash2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:5000/chat';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('nebula_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('nebula_chats', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post(API_URL, { messages: [...messages, userMsg].map(({role, content}) => ({role, content})) });
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.content, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Lost connection to the Nebula. Ensure backend is running.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="app-wrapper">
      <div className="nebula-bg" />
      
      <header>
        <div className="logo-wrap">
          <div className="logo-icon"><Sparkles size={22} color="white" /></div>
          <span className="logo-text">NEBULA AI</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setMessages([])} className="theme-toggle" title="Clear Portal">
            <Trash2 size={20} />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="chat-container">
        {messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hero">
            <Sparkles size={60} color="#8b5cf6" style={{ marginBottom: '2rem' }} />
            <h2>Welcome to Nebula</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Initiate a neural link to begin.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.9, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className={`message-node ${msg.role}`}
              >
                <div className="bubble">
                  {msg.content}
                </div>
                <div className="meta-info">
                  <span>{msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} />} {msg.time}</span>
                  <button 
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-node ai">
            <div className="typing-wave">
              <div className="wave-dot" style={{ animationDelay: '0s' }} />
              <div className="wave-dot" style={{ animationDelay: '0.2s' }} />
              <div className="wave-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </main>

      <form className="input-dock" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Command the Nebula..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" className="action-btn" disabled={!input.trim() || loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
}

export default App;
