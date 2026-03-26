import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { Shield, Zap, Trophy, Target, Clock, TrendingUp, ChevronRight, BookOpen, Star } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const CAT_COLORS = { web: '#00d4ff', network: '#00ff88', crypto: '#8b5cf6', forensics: '#ffaa00', reversing: '#ff6b35' }
const CAT_ICONS = { web: '🌐', network: '🌐', crypto: '🔐', forensics: '🔍', reversing: '⚙️' }

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  const stats = data?.stats || {}
  const userData = data?.user || user || {}
  const catStats = data?.category_stats || {}
  const recent = data?.recent_activity || []
  const achievements = data?.achievements || []

  const xpToNext = data?.user?.xp_to_next || 500
  const xpCurrent = userData.xp || 0
  const xpProgress = Math.round((xpCurrent % 500) / 5)

  const catData = Object.entries(catStats).map(([cat, count]) => ({
    name: cat, value: count, fill: CAT_COLORS[cat] || '#888'
  }))

  const xpChartData = [
    { name: 'Week 1', xp: Math.max(0, xpCurrent - 400) },
    { name: 'Week 2', xp: Math.max(0, xpCurrent - 250) },
    { name: 'Week 3', xp: Math.max(0, xpCurrent - 100) },
    { name: 'Now', xp: xpCurrent },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 6, letterSpacing: '0.1em' }}>
          DASHBOARD
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          Welcome back, <span style={{ color: 'var(--accent)' }}>{userData.username}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {userData.rank} · Level {userData.level} · {userData.streak || 0} day streak 🔥
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Zap size={18} />} label="Total XP" value={xpCurrent.toLocaleString()} color="var(--accent)" />
        <StatCard icon={<Target size={18} />} label="Labs Completed" value={`${stats.completed || 0}/${stats.total_labs || 0}`} color="var(--green)" />
        <StatCard icon={<TrendingUp size={18} />} label="Completion Rate" value={`${stats.completion_rate || 0}%`} color="var(--purple)" />
        <StatCard icon={<Clock size={18} />} label="In Progress" value={stats.in_progress || 0} color="var(--yellow)" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* XP chart */}
        <Card title="XP Progress" icon={<TrendingUp size={14} />}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={xpChartData}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
              <Area type="monotone" dataKey="xp" stroke="var(--accent)" fill="url(#xpGrad)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Level card */}
        <Card title="Level Progress" icon={<Star size={14} />}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <ResponsiveContainer width={120} height={120}>
                <RadialBarChart cx={60} cy={60} innerRadius={40} outerRadius={55} startAngle={90} endAngle={-270} data={[{ value: xpProgress, fill: 'var(--accent)' }]}>
                  <RadialBar background={{ fill: 'var(--border)' }} dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{userData.level}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>LEVEL</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>{userData.rank}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{xpToNext} XP to next level</div>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent activity */}
        <Card title="Recent Activity" icon={<BookOpen size={14} />}>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <BookOpen size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>No activity yet. Start a lab!</p>
              <button onClick={() => navigate('/labs')} style={{
                marginTop: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--accent)',
                background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}>Browse Labs</button>
            </div>
          ) : recent.map((item, i) => (
            <div key={i} onClick={() => navigate(`/labs/${item.lab_slug}`)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
            }}>
              <StatusDot status={item.status} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.lab_title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.status} · {Math.round(item.progress_pct)}%</div>
              </div>
              <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${item.progress_pct}%`, background: item.status === 'completed' ? 'var(--green)' : 'var(--accent)', borderRadius: 2 }} />
              </div>
              <ChevronRight size={12} color="var(--text-muted)" />
            </div>
          ))}
        </Card>

        {/* Achievements */}
        <Card title="Achievements" icon={<Trophy size={14} />}>
          {achievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <Trophy size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Complete labs to earn achievements!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {achievements.slice(0, 4).map((a, i) => (
                <div key={i} style={{
                  background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Earned</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          {catData.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em' }}>CATEGORIES EXPLORED</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catData.map(({ name, value, fill }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14 }}>{CAT_ICONS[name] || '📁'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{name}</span>
                        <span style={{ color: fill, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{value} done</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${Math.min(value * 33, 100)}%`, background: fill, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</span>
        <div style={{ color, opacity: 0.7 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</div>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
        {icon} {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function StatusDot({ status }) {
  const colors = { completed: 'var(--green)', in_progress: 'var(--accent)', not_started: 'var(--text-muted)' }
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || 'var(--text-muted)', flexShrink: 0 }} />
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>Loading dashboard...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
