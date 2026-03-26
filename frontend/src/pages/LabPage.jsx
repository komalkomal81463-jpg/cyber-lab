import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronLeft, Clock, Zap, CheckCircle, Circle, Lightbulb,
  Flag, Play, BookOpen, Terminal as TerminalIcon, ChevronDown, ChevronRight, X, AlertCircle
} from 'lucide-react'
import api from '../utils/api'
import Terminal from '../components/Terminal'

const DIFF_COLORS = { beginner: 'var(--green)', intermediate: 'var(--yellow)', advanced: 'var(--red)' }
const CAT_ICONS = { web: '🌐', network: '🔌', crypto: '🔐', forensics: '🔍', reversing: '⚙️' }

export default function LabPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [lab, setLab] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState(null)
  const [activeTab, setActiveTab] = useState('instructions') // instructions | terminal
  const [hintsRevealed, setHintsRevealed] = useState([])
  const [flagInput, setFlagInput] = useState('')
  const [flagMsg, setFlagMsg] = useState(null)
  const [taskMsg, setTaskMsg] = useState(null)
  const [started, setStarted] = useState(false)

  useEffect(() => { fetchLab() }, [slug])

  const fetchLab = async () => {
    try {
      const res = await api.get(`/labs/${slug}`)
      setLab(res.data)
      setProgress(res.data.user_progress)
      if (res.data.user_progress?.status === 'in_progress' || res.data.user_progress?.status === 'completed') {
        setStarted(true)
        await initTerminal()
      }
    } finally {
      setLoading(false)
    }
  }

  const initTerminal = async () => {
    try {
      const res = await api.post('/terminal/session', { lab_slug: slug })
      setSessionId(res.data.session_id)
    } catch (e) { console.error('Terminal init failed', e) }
  }

  const startLab = async () => {
    await api.post(`/labs/${slug}/start`)
    await initTerminal()
    setStarted(true)
    setActiveTab('terminal')
    fetchLab()
  }

  const completeTask = async (taskId) => {
    const res = await api.post(`/labs/${slug}/complete-task`, { task_id: taskId })
    setProgress(p => ({ ...p, completed_tasks: res.data.completed_tasks, progress_pct: res.data.progress_pct }))
    setTaskMsg('✅ Task marked complete! XP awarded.')
    setTimeout(() => setTaskMsg(null), 2500)
  }

  const submitFlag = async () => {
    const res = await api.post(`/labs/${slug}/submit-flag`, { flag: flagInput })
    setFlagMsg({ success: res.data.success, text: res.data.message })
    if (res.data.success) {
      fetchLab()
      setTimeout(() => setFlagMsg(null), 4000)
    }
  }

  const useHint = async (idx) => {
    if (hintsRevealed.includes(idx)) return
    const res = await api.post(`/labs/${slug}/use-hint`, { hint_index: idx })
    setHintsRevealed(h => [...h, idx])
  }

  if (loading) return <LoadingScreen />
  if (!lab) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Lab not found.</div>

  const tasks = lab.tasks || []
  const hints = lab.hints || []
  const completedTasks = progress?.completed_tasks || []
  const isCompleted = progress?.status === 'completed'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0,
      }}>
        <button onClick={() => navigate('/labs')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          padding: '6px 10px', borderRadius: 6, fontFamily: 'var(--font-sans)',
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={14} /> Labs
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{CAT_ICONS[lab.category] || '🔧'}</span>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700 }}>{lab.title}</h1>
            <div style={{ display: 'flex', align: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ color: DIFF_COLORS[lab.difficulty], fontWeight: 600, textTransform: 'uppercase' }}>{lab.difficulty}</span>
              <span><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{lab.estimated_time}m</span>
              <span style={{ color: 'var(--yellow)' }}><Zap size={10} style={{ display: 'inline', marginRight: 3 }} />{lab.xp_reward} XP</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', align: 'center', gap: 8 }}>
          {isCompleted ? (
            <div style={{ display: 'flex', align: 'center', gap: 6, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
              <CheckCircle size={16} /> Completed!
            </div>
          ) : (
            <div style={{ display: 'flex', align: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(progress?.progress_pct || 0)}%
              </span>
              <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${progress?.progress_pct || 0}%`, background: 'var(--accent)', borderRadius: 3 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Instructions / tabs */}
        <div style={{ width: 480, minWidth: 380, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {[
              { id: 'instructions', label: 'Instructions', icon: <BookOpen size={13} /> },
              { id: 'terminal', label: 'Terminal', icon: <TerminalIcon size={13} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 16px', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {activeTab === 'instructions' ? (
              <div>
                {/* Start button if not started */}
                {!started && (
                  <div style={{
                    background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.3)',
                    borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24, textAlign: 'center',
                  }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                      Read the instructions below, then start the lab to access the terminal.
                    </p>
                    <button onClick={startLab} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 24px', borderRadius: 8, border: 'none',
                      background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}>
                      <Play size={15} /> Start Lab
                    </button>
                  </div>
                )}

                {/* Markdown instructions */}
                <div className="markdown-body" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  <MarkdownContent content={lab.instructions} />
                </div>
              </div>
            ) : (
              /* Terminal tab */
              <div style={{ height: '100%', minHeight: 300 }}>
                {!started ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <TerminalIcon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ marginBottom: 16 }}>Start the lab to access the terminal</p>
                    <button onClick={startLab} style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none',
                      background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}>
                      <Play size={14} style={{ display: 'inline', marginRight: 6 }} />Start Lab
                    </button>
                  </div>
                ) : sessionId ? (
                  <Terminal labSlug={slug} sessionId={sessionId} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Initializing terminal...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tasks, hints, flag */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {taskMsg && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.3)',
              color: 'var(--green)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
            }}>{taskMsg}</div>
          )}

          {isCompleted && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.3)',
              borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Lab Completed!</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>You earned {lab.xp_reward} XP</div>
            </div>
          )}

          {/* Tasks */}
          <Section title="Tasks" icon={<CheckCircle size={13} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((task, i) => {
                const done = completedTasks.includes(task.id)
                return (
                  <div key={task.id} style={{
                    background: done ? 'rgba(0,255,136,0.05)' : 'var(--bg-elevated)',
                    border: `1px solid ${done ? 'rgba(0,255,136,0.2)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <div style={{ marginTop: 2, color: done ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {done ? <CheckCircle size={16} /> : <Circle size={16} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, color: done ? 'var(--green)' : 'var(--text-primary)' }}>
                        {i + 1}. {task.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{task.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 4 }}>+{task.xp} XP</div>
                    </div>
                    {!done && started && (
                      <button onClick={() => completeTask(task.id)} style={{
                        padding: '5px 12px', borderRadius: 6, border: '1px solid var(--accent)',
                        background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 11,
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}>Mark Done</button>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Hints */}
          <Section title={`Hints (${hints.length})`} icon={<Lightbulb size={13} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hints.map((hint, i) => (
                <div key={i} style={{
                  border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
                }}>
                  <button onClick={() => useHint(i)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: hintsRevealed.includes(i) ? 'rgba(255,170,0,0.08)' : 'var(--bg-elevated)',
                    border: 'none', cursor: 'pointer', color: hintsRevealed.includes(i) ? 'var(--yellow)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-sans)', fontSize: 13,
                  }}>
                    <span>💡 Hint {i + 1} {!hintsRevealed.includes(i) && '(click to reveal)'}</span>
                    {hintsRevealed.includes(i) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {hintsRevealed.includes(i) && (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(255,170,0,0.04)', lineHeight: 1.6, borderTop: '1px solid var(--border)' }}>
                      {hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Flag submission */}
          {!isCompleted && (
            <Section title="Submit Flag" icon={<Flag size={13} />}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Found the flag? Enter it below. Format: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>FLAG&#123;...&#125;</code>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={flagInput}
                  onChange={e => setFlagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitFlag()}
                  placeholder="FLAG{...}"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                />
                <button onClick={submitFlag} style={{
                  padding: '10px 18px', borderRadius: 8, border: 'none',
                  background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0,
                }}>Submit</button>
              </div>
              {flagMsg && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 6, fontSize: 13,
                  background: flagMsg.success ? 'var(--green-dim)' : 'var(--red-dim)',
                  border: `1px solid ${flagMsg.success ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)'}`,
                  color: flagMsg.success ? 'var(--green)' : 'var(--red)',
                }}>
                  {flagMsg.text}
                </div>
              )}
            </Section>
          )}

          {/* Tools available */}
          <Section title="Tools Available" icon={<TerminalIcon size={13} />}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(lab.tools || []).map(tool => (
                <span key={tool} style={{
                  padding: '4px 12px', borderRadius: 6,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)',
                }}>
                  {tool}
                </span>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Markdown styles */}
      <style>{`
        .markdown-body h2 { color: var(--accent); font-size: 15px; margin: 20px 0 10px; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
        .markdown-body h3 { color: var(--text-primary); font-size: 14px; margin: 16px 0 8px; font-weight: 600; }
        .markdown-body p { margin-bottom: 12px; }
        .markdown-body code { font-family: var(--font-mono); background: var(--bg-elevated); color: var(--green); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .markdown-body pre { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 14px; overflow: auto; margin: 12px 0; }
        .markdown-body pre code { background: none; padding: 0; color: var(--green); font-size: 12px; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        .markdown-body th { background: var(--bg-elevated); color: var(--accent); padding: 8px 12px; text-align: left; border: 1px solid var(--border); }
        .markdown-body td { padding: 8px 12px; border: 1px solid var(--border); color: var(--text-secondary); }
        .markdown-body ul, .markdown-body ol { padding-left: 20px; margin-bottom: 12px; }
        .markdown-body li { margin-bottom: 4px; }
        .markdown-body strong { color: var(--text-primary); font-weight: 600; }
      `}</style>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
        {icon} {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content || ''}
    </ReactMarkdown>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>Loading lab environment...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
