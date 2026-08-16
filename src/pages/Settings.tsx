import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  FileText, UploadCloud, Eye, LogOut, Check, Save
} from 'lucide-react';
import ResumeViewerModal from '../components/ResumeViewerModal';

export default function Settings() {
  const { session, signOut } = useAuth();
  const [name, setName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceSummary, setExperienceSummary] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/profile');
      if (res.data) {
        setName(res.data.full_name || '');
        setResumeText(res.data.resume_text || '');
        setTargetRole(res.data.target_role || '');
        setSkills(res.data.skills || []);
        setExperienceSummary(res.data.experience_summary || '');
      }
    } catch {
      const savedLocal = localStorage.getItem('profile');
      if (savedLocal) {
        const p = JSON.parse(savedLocal);
        setName(p.name || '');
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a valid PDF document.');
      return;
    }

    setUploadingPdf(true);
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiClient.post('/profile/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.profile) {
        const p = res.data.profile;
        if (p.full_name && !name) setName(p.full_name);
        if (p.resume_text) setResumeText(p.resume_text);
        if (p.target_role) setTargetRole(p.target_role);
        if (p.skills) setSkills(p.skills);
        if (p.experience_summary) setExperienceSummary(p.experience_summary);
      }

      toast.success('Resume uploaded and parsed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process resume PDF.');
      setUploadedFileName('');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await apiClient.put('/profile', {
        full_name: name,
        target_role: targetRole,
        resume_text: resumeText,
        skills,
        experience_summary: experienceSummary,
      });
      localStorage.setItem('profile', JSON.stringify({ name }));
      setNameSaved(true);
      toast.success('Name updated successfully!');
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      toast.error('Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const userEmail = session?.user?.email || 'pandeyji252002@gmail.com';
  const displayName = name || session?.user?.user_metadata?.full_name || 'Abhishek Kumar Pandey';

  return (
    <div className="settings-page">
      
      {/* Page Header */}
      <div className="settings-header">
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          Settings & Resume
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Manage your resume and account information.
        </p>
      </div>

      {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
      <div className="settings-grid">
        
        {/* CARD 1: RESUME */}
        <div className="settings-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <FileText size={17} style={{ color: 'var(--accent-color)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Resume
              </h2>
            </div>

            {/* Master Resume Status */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.55rem',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '0.45rem',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}>
                  <FileText size={16} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {uploadedFileName || (resumeText ? 'Master Resume' : 'No Resume Uploaded')}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: resumeText ? '#10b981' : 'var(--text-muted)', margin: '0.1rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {resumeText ? (
                      <>
                        <Check size={11} color="#10b981" /> Active for AI Tailoring
                      </>
                    ) : (
                      'Upload PDF to enable AI tailoring'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPdf}
              style={{ flex: 1, padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
            >
              {uploadingPdf ? (
                <>
                  <span className="spinner" style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud size={15} /> Upload Resume
                </>
              )}
            </button>

            {resumeText && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResumeModal(true)}
                style={{ padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
              >
                <Eye size={15} /> View Resume
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: PERSONAL INFORMATION */}
        <div className="settings-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Personal Information
              </h2>
            </div>

            {/* Full Name Edit Form */}
            <form onSubmit={handleSaveName} style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Abhishek Kumar Pandey"
                  style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                />
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={savingName || !name.trim()}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {nameSaved ? <Check size={13} color="#10b981" /> : <Save size={13} />}
                  {nameSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </form>

            {/* Account Information Display */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Account
              </label>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.55rem',
                padding: '0.65rem 0.85rem',
              }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                  {displayName}
                </p>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CARD 3: SIGN OUT ACTION */}
      <div className="settings-action-card">
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)', margin: 0 }}>
            Session & Authentication
          </p>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0 0' }}>
            Sign out of your active session.
          </p>
        </div>
        <button
          onClick={signOut}
          className="btn btn-secondary"
          style={{
            color: 'var(--danger-color)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
          }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Resume Viewer Modal */}
      {showResumeModal && (
        <ResumeViewerModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          profile={{
            full_name: name,
            target_role: targetRole,
            resume_text: resumeText,
            skills,
            experience_summary: experienceSummary,
          }}
        />
      )}

    </div>
  );
}
