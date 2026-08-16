import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import FlowchartModal from './FlowchartModal';
import { MessageCircle, X, Send, Bot, GitBranch, Maximize2, ExternalLink } from 'lucide-react';

interface FlowchartData {
  title: string;
  description?: string;
  mermaid_code: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  flowchart?: FlowchartData | null;
}

export default function AIChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "👋 Hi! I'm your AI career and technical assistant. Ask me anything — interview tips, system design, DSA roadmaps, resume feedback, or ask me to generate a flowchart / architecture diagram!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFlowchart, setActiveFlowchart] = useState<FlowchartData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await apiClient.post('/ai/chat', { message: userMessage, history });
      const rawReply = res.data.reply || '';

      // Check for flowchart block
      let extractedFlowchart: FlowchartData | null = res.data.flowchart || null;
      let cleanContent = rawReply;

      const fcMatch = rawReply.match(/```flowchart\s*([\s\S]*?)\s*```/);
      if (fcMatch && fcMatch[1]) {
        try {
          const parsed = JSON.parse(fcMatch[1].trim());
          if (parsed.title && parsed.mermaid_code) {
            extractedFlowchart = parsed;
          }
        } catch (e) {
          console.error('Failed to parse flowchart block', e);
        }
        cleanContent = rawReply.replace(/```flowchart\s*[\s\S]*?\s*```/, '').trim();
      }

      // Also clean any raw mermaid blocks from text display so chat remains super neat
      const mermaidMatch = cleanContent.match(/```mermaid\s*([\s\S]*?)\s*```/);
      if (mermaidMatch && mermaidMatch[1] && !extractedFlowchart) {
        extractedFlowchart = {
          title: 'System Flowchart',
          mermaid_code: mermaidMatch[1].trim(),
        };
        cleanContent = cleanContent.replace(/```mermaid\s*[\s\S]*?\s*```/, '').trim();
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: cleanContent,
          flowchart: extractedFlowchart,
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'model', content: '⚠️ Sorry, something went wrong. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`ai-chat-btn ${open ? 'chat-open' : ''}`}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'var(--accent-color)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 25px rgba(59,130,246,0.6)',
          zIndex: 1000,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          color: 'white',
        }}
        title="AI Assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="ai-chat-window" style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '2rem',
          width: '420px',
          maxWidth: 'calc(100vw - 2rem)',
          height: '580px',
          maxHeight: 'calc(100vh - 7rem)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          zIndex: 999,
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            background: 'rgba(15, 23, 42, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              <div style={{
                background: 'rgba(59,130,246,0.15)',
                borderRadius: '50%',
                padding: '0.4rem',
                display: 'flex',
                flexShrink: 0,
              }}>
                <Bot size={16} style={{ color: 'var(--accent-color)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI Career & Tech Assistant</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Instant roadmaps, design & flowcharts</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Close Chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-color)',
          }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                {/* Bot Avatar Icon for Left-Side Messages */}
                {m.role === 'model' && (
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                  }}>
                    <Bot size={15} style={{ color: '#ffffff' }} />
                  </div>
                )}

                <div style={{
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {/* Message Bubble */}
                  <div
                    className={m.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-model'}
                    style={{
                      background: m.role === 'user'
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : '#1e293b',
                      border: m.role === 'user'
                        ? 'none'
                        : '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: m.role === 'user'
                        ? '1rem 1rem 0.25rem 1rem'
                        : '0.25rem 1rem 1rem 1rem',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: '#f8fafc',
                      boxShadow: m.role === 'user'
                        ? '0 3px 10px rgba(59, 130, 246, 0.3)'
                        : '0 4px 14px rgba(0, 0, 0, 0.35)',
                      wordBreak: 'break-word',
                    }}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>

                  {/* Attached Interactive Flowchart Card */}
                  {m.flowchart && (
                    <div style={{
                      marginTop: '0.6rem',
                      width: '100%',
                      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35), #111827)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '0.75rem',
                      padding: '0.85rem 1rem',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <GitBranch size={16} style={{ color: 'var(--accent-color)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#93c5fd' }}>
                          {m.flowchart.title}
                        </span>
                      </div>

                      {m.flowchart.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                          {m.flowchart.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setActiveFlowchart(m.flowchart || null)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem', flex: 1 }}
                        >
                          <Maximize2 size={13} /> View Diagram
                        </button>
                        <button
                          onClick={() => {
                            setOpen(false);
                            navigate('/flowcharts');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                          title="Go to Flowchart section"
                        >
                          <ExternalLink size={13} /> Section
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.4rem', padding: '0.5rem' }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      opacity: 0.7,
                      animation: `bounce 1.2s ${i * 0.2}s infinite`
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
          }}>
            <input
              className="input"
              style={{ flex: 1, padding: '0.625rem 0.875rem', fontSize: '0.875rem' }}
              placeholder="Ask anything or 'Create flowchart for...'"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{ padding: '0.625rem 0.875rem' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Popup Modal */}
      {activeFlowchart && (
        <FlowchartModal
          isOpen={!!activeFlowchart}
          onClose={() => setActiveFlowchart(null)}
          title={activeFlowchart.title}
          description={activeFlowchart.description}
          mermaidCode={activeFlowchart.mermaid_code}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
