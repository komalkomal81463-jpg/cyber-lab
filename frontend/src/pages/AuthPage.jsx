import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Terminal, Lock, User, Mail, Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const { login, register, loading, error, clearError, token } = useAuthStore()
  const navigate = useNavigate()
  const [typedText, setTypedText] = useState('')
  const fullText = '> Initializing CyberLab environment...\n> Loading modules: [SQLi] [XSS] [Nmap] [Crypto]\n> Ready. Welcome, hacker.'

  useEffect(() => { if (token) navigate('/') }, [token])

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i++))
      if (i > fullText.length) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const result = mode === 'login'
      ? await login(form.username, form.password)
      : await register(form)
    if (result.success) navigate('/')
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px', background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', position: 'relative',
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '30%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px var(--accent-glow)',
            }}>
              <Shield size={24} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.08em' }}>
                CYBER<span style={{ color: 'var(--accent)' }}>LAB</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Virtual Security Training
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Learn Ethical<br />
            <span style={{ color: 'var(--accent)' }}>Hacking</span> by Doing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
            Practice real cybersecurity skills in a safe, simulated environment. 
            From SQL injection to network forensics — all hands-on.
          </p>

          {/* Terminal preview */}
          <div style={{
            background: '#0a0e1a', border: '1px solid var(--border)', borderRadius: 10,
            padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--green)', lineHeight: 1.8, maxWidth: 420,
            boxShadow: '0 0 30px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 11 }}>terminal — cyberlab</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {typedText}<span className="cursor" />
            </pre>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[['9+', 'Labs'], ['5', 'Categories'], ['100%', 'Hands-On']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 48px',
      }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {mode === 'login'
              ? 'Demo: username=demo, password=Demo@123'
              : 'Join the hacker community'}
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 4, marginBottom: 28 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); clearError() }} style={{
              flex: 1, padding: '8px', borderRadius: 6, border: 'none',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#000' : 'var(--text-secondary)',
              fontWeight: mode === m ? 700 : 400,
              fontSize: 13, transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <Field icon={<User size={14} />} placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
          )}
          <Field icon={<Terminal size={14} />} placeholder="Username" value={form.username} onChange={set('username')} required />
          {mode === 'register' && (
            <Field icon={<Mail size={14} />} placeholder="Email address" type="email" value={form.email} onChange={set('email')} required />
          )}
          <div style={{ position: 'relative' }}>
            <Field icon={<Lock size={14} />} placeholder="Password" type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0,
            }}>
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(255,68,102,0.3)',
              color: 'var(--red)', borderRadius: 6, padding: '10px 14px', fontSize: 13,
            }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: 8, padding: '12px', borderRadius: 8, border: 'none',
            background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #0088cc)',
            color: loading ? 'var(--text-muted)' : '#000',
            fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Zap size={15} />
            {loading ? 'Authenticating...' : (mode === 'login' ? 'Access Terminal' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
        {icon}
      </div>
      <input style={{ paddingLeft: 36 }} {...props} />
    </div>
  )
}
