import { useEffect, useState } from 'react'
import { Trophy, Zap, Crown, Medal } from 'lucide-react'
import api from '../utils/api'

export default function LeaderboardPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/progress/leaderboard').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown size={16} style={{ color: '#FFD700' }} />
    if (rank === 2) return <Medal size={16} style={{ color: '#C0C0C0' }} />
    if (rank === 3) return <Medal size={16} style={{ color: '#CD7F32' }} />
    return <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 16, textAlign: 'center', display: 'inline-block' }}>{rank}</span>
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800, margin: '0 auto' }} className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 6, letterSpacing: '0.1em' }}>RANKINGS</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Top hackers ranked by XP</p>
      </div>

      {/* Top 3 podium */}
      {data.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          {[data[1], data[0], data[2]].map((user, i) => {
            const heights = [140, 170, 120]
            const colors = ['#C0C0C0', '#FFD700', '#CD7F32']
            const isMe = user?.is_me
            return user ? (
              <div key={user.username} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors[i]}, ${colors[i]}aa)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#000',
                  boxShadow: `0 0 16px ${colors[i]}66`,
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>{user.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{user.xp} XP</div>
                </div>
                <div style={{
                  width: 90, height: heights[i], background: `${colors[i]}22`,
                  border: `1px solid ${colors[i]}44`, borderRadius: '8px 8px 0 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: colors[i],
                }}>
                  {i === 0 ? '2' : i === 1 ? '1' : '3'}
                </div>
              </div>
            ) : null
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '40px 1fr 80px 100px 80px', gap: 12, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
          <span>#</span>
          <span>HACKER</span>
          <span>LEVEL</span>
          <span>XP</span>
          <span>RANK</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : data.map((user, i) => (
          <div key={user.username} style={{
            padding: '14px 20px', display: 'grid', gridTemplateColumns: '40px 1fr 80px 100px 80px', gap: 12, alignItems: 'center',
            borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none',
            background: user.is_me ? 'rgba(0,212,255,0.05)' : 'transparent',
            borderLeft: user.is_me ? '3px solid var(--accent)' : '3px solid transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rankIcon(user.rank)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${user.is_me ? 'var(--accent)' : 'var(--purple)'}, var(--border))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: user.is_me ? '#000' : 'var(--text-primary)',
              }}>
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: user.is_me ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {user.username} {user.is_me && <span style={{ fontSize: 10, color: 'var(--accent)' }}>(you)</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.full_name}</div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
              Lv.{user.level}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--yellow)', fontWeight: 600 }}>
              <Zap size={11} style={{ display: 'inline', marginRight: 3 }} />
              {user.xp.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {user.rank_title}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
