import { useEffect, useState } from 'react'
import { User, Mail, Calendar, Zap, Star, Shield, Edit2, Save, X } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const [progress, setProgress] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/progress/').then(r => setProgress(r.data)).catch(() => {})
    if (user) setForm({ full_name: user.full_name || '' })
  }, [user])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/auth/profile', form)
      await fetchMe()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const completed = progress.filter(p => p.status === 'completed')
  const inProgress = progress.filter(p => p.status === 'in_progress')

  const xpProgress = user ? Math.min((user.xp % 500) / 5, 100) : 0

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800, margin: '0 auto' }} className="fade-in">
      <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 20, letterSpacing: '0.1em' }}>
        PROFILE
      </div>

      {/* Profile card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        padding: '28px', marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        {/* BG gradient */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1))',
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#000',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>

          <div style={{ flex: 1, paddingTop: 8 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={{ maxWidth: 240 }} placeholder="Full name" />
                <button onClick={save} disabled={saving} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Save size={12} /> Save
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.full_name || user?.username}</h2>
                <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>@{user?.username}</div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Mail size={11} /> {user?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Calendar size={11} /> Joined {user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
              {user?.rank}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              Lv.{user?.level}
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>
              <Zap size={11} style={{ display: 'inline', marginRight: 4 }} />
              {user?.xp?.toLocaleString()} XP
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{xpProgress}% to next level</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg, var(--accent), var(--purple))', borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Labs Completed', value: completed.length, color: 'var(--green)', icon: '✅' },
          { label: 'In Progress', value: inProgress.length, color: 'var(--accent)', icon: '⚡' },
          { label: 'Day Streak', value: user?.streak || 0, color: 'var(--yellow)', icon: '🔥' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Completed labs list */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 16 }}>
          COMPLETED LABS ({completed.length})
        </div>
        {completed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            No labs completed yet. Head to the Labs section to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.lab_title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.completed_at ? `Completed ${new Date(p.completed_at).toLocaleDateString()}` : 'Completed'}
                    {p.hints_used > 0 && ` · ${p.hints_used} hints used`}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>✓ Done</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
