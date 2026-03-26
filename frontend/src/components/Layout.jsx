import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Terminal, LayoutDashboard, BookOpen, Trophy, User, LogOut, Shield, Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/labs', icon: BookOpen, label: 'Labs' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const xpPercent = user ? Math.min((user.xp % 500) / 5, 100) : 0

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        minWidth: 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
          backgroundSize: '20px 20px', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}>
              <Shield size={18} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>CYBER<span style={{ color: 'var(--accent)' }}>LAB</span></div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>v1.0.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius)',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 13,
              transition: 'all 0.15s',
              textDecoration: 'none',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        {user && (
          <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
              padding: 12, border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--purple), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</div>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Lv.{user.level} {user.rank}</div>
                </div>
              </div>
              {/* XP bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}><Zap size={9} style={{ display: 'inline' }} /> {user.xp} XP</span>
                </div>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg, var(--accent), var(--purple))', borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
              </div>
              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '6px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 11,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.target.style.color = 'var(--red)'; e.target.style.borderColor = 'var(--red)' }}
                onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'var(--border)' }}
              >
                <LogOut size={11} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  )
}
