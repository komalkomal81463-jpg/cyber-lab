import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Clock, Zap, ChevronRight, CheckCircle, Circle, Play, Lock } from 'lucide-react'
import api from '../utils/api'

const CATEGORIES = ['all', 'web', 'network', 'crypto', 'forensics', 'reversing']
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced']
const DIFF_COLORS = { beginner: 'var(--green)', intermediate: 'var(--yellow)', advanced: 'var(--red)' }
const CAT_ICONS = { web: '🌐', network: '🔌', crypto: '🔐', forensics: '🔍', reversing: '⚙️' }

export default function LabsPage() {
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    const params = {}
    if (category !== 'all') params.category = category
    if (difficulty !== 'all') params.difficulty = difficulty
    api.get('/labs/', { params }).then(r => { setLabs(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [category, difficulty])

  const filtered = labs.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.tags || []).some(t => t.includes(search.toLowerCase()))
  )

  const completed = labs.filter(l => l.user_progress?.status === 'completed').length
  const inProgress = labs.filter(l => l.user_progress?.status === 'in_progress').length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 6, letterSpacing: '0.1em' }}>TRAINING MODULES</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Security Labs</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {labs.length} labs · {completed} completed · {inProgress} in progress
            </p>
          </div>
          {/* Progress bar */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
              {labs.length > 0 ? Math.round(completed / labs.length * 100) : 0}% Complete
            </div>
            <div style={{ width: 160, height: 5, background: 'var(--border)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${labs.length > 0 ? completed / labs.length * 100 : 0}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search labs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '8px 14px', borderRadius: 6, border: '1px solid',
              borderColor: category === c ? 'var(--accent)' : 'var(--border)',
              background: category === c ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              color: category === c ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>
              {c !== 'all' && CAT_ICONS[c] + ' '}{c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDifficulty(d)} style={{
              padding: '8px 14px', borderRadius: 6, border: '1px solid',
              borderColor: difficulty === d ? DIFF_COLORS[d] || 'var(--accent)' : 'var(--border)',
              background: difficulty === d ? `${DIFF_COLORS[d] || 'var(--accent)'}20` : 'var(--bg-elevated)',
              color: difficulty === d ? DIFF_COLORS[d] || 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Lab grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15 }}>No labs found matching your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(lab => <LabCard key={lab.slug} lab={lab} onClick={() => navigate(`/labs/${lab.slug}`)} />)}
        </div>
      )}
    </div>
  )
}

function LabCard({ lab, onClick }) {
  const prog = lab.user_progress || {}
  const status = prog.status || 'not_started'
  const pct = prog.progress_pct || 0

  const statusColors = { completed: 'var(--green)', in_progress: 'var(--accent)', not_started: 'var(--text-muted)' }
  const statusIcons = { completed: <CheckCircle size={13} />, in_progress: <Play size={13} />, not_started: <Circle size={13} /> }

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Progress bar at top */}
      {status !== 'not_started' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: status === 'completed' ? 'var(--green)' : 'var(--accent)', borderRadius: '2px 0 0 0', transition: 'width 0.3s' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>{CAT_ICONS[lab.category] || '🔧'}</span>
          <div>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
              background: `${DIFF_COLORS[lab.difficulty]}20`, color: DIFF_COLORS[lab.difficulty],
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {lab.difficulty}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: statusColors[status], fontSize: 11 }}>
          {statusIcons[status]}
          <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{lab.title}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {lab.description}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {(lab.tags || []).slice(0, 3).map(tag => (
          <span key={tag} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4,
            background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
          }}>#{tag}</span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <Clock size={11} /> {lab.estimated_time}m
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--yellow)' }}>
            <Zap size={11} /> {lab.xp_reward} XP
          </div>
        </div>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  )
}

function SkeletonCard() {
  const pulse = { background: 'var(--bg-elevated)', borderRadius: 4, animation: 'pulse 1.5s infinite' }
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
      <div style={{ ...pulse, height: 12, width: '40%', marginBottom: 16 }} />
      <div style={{ ...pulse, height: 16, width: '80%', marginBottom: 8 }} />
      <div style={{ ...pulse, height: 12, width: '100%', marginBottom: 6 }} />
      <div style={{ ...pulse, height: 12, width: '70%', marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[60, 70, 50].map(w => <div key={w} style={{ ...pulse, height: 20, width: w }} />)}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
