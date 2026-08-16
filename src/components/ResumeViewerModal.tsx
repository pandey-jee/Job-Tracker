import { useState } from 'react';
import { toast } from 'react-toastify';
import { X, FileText, Copy, Check, Download, Sparkles, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    full_name?: string;
    target_role?: string;
    resume_text?: string;
    skills?: string[];
    experience_summary?: string;
  } | null;
}

export default function ResumeViewerModal({ isOpen, onClose, profile }: ResumeViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !profile) return null;

  const handleCopy = () => {
    if (!profile.resume_text) return;
    navigator.clipboard.writeText(profile.resume_text);
    setCopied(true);
    toast.success('Full resume text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!profile.resume_text) return;
    const blob = new Blob([profile.resume_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.full_name || 'resume').toLowerCase().replace(/\s+/g, '_')}_master_resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Resume downloaded!');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1.5rem',
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color)',
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {profile.full_name || 'Candidate Master Resume'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                {profile.target_role || 'Software Engineering Resume'} • AI Synced & Active
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
              title="Copy Full Resume Text"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            <button
              onClick={handleDownloadTxt}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
              title="Download Resume TXT"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.25rem',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Quick Highlights Banner */}
          <div style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            {profile.experience_summary && (
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={13} /> Executive Summary
                </span>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.55 }}>
                  {profile.experience_summary}
                </p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '0.4rem' }}>
                  Core Competencies & Technical Skills ({profile.skills.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '0.375rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent-color)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Extracted Resume Content */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Briefcase size={14} /> Full Resume Content
            </div>
            {profile.resume_text ? (
              <div className="markdown-body" style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {profile.resume_text}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No resume content found. Please upload your Resume PDF in Settings.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.9rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(255, 255, 255, 0.015)',
        }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
