import { useState } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../context/AuthContext';
import { LayoutDashboard, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message);
        else toast.success('Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) toast.error(error.message);
        else toast.success('Account created successfully! You may now sign in.');
      }
    } catch {
      toast.error('Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(59, 130, 246, 0.15), rgba(255, 255, 255, 0))',
      zIndex: 9999,
      padding: '1.5rem',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        padding: '2.25rem',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem', justifyContent: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '0.6rem',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-color)',
          }}>
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Job Tracker
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              AI Career Copilot
            </span>
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', textAlign: 'center', color: 'var(--text-primary)' }}>
          {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
          {isLogin ? 'Sign in to manage your applications and study hub' : 'Track applications, master your resume & practice with AI'}
        </p>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Mail size={13} /> Email Address
            </label>
            <input
              required
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Lock size={13} /> Password
            </label>
            <input
              required
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.7rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                Processing...
              </span>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                padding: 0,
                textDecoration: 'underline',
              }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
