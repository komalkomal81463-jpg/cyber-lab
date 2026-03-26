import { useState, useRef, useEffect } from 'react'
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react'
import api from '../utils/api'

export default function Terminal({ labSlug, sessionId }) {
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setHistory([{
      type: 'system',
      text: `╔══════════════════════════════════════════════════╗
║         🔐 CyberLab Terminal v1.0.0              ║
║         Simulated Security Environment            ║
╚══════════════════════════════════════════════════╝
Type 'help' for available commands.
`
    }])
  }, [labSlug])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const run = async (cmd) => {
    if (!cmd.trim()) return
    const trimmed = cmd.trim()

    setHistory(h => [...h, { type: 'input', text: `hacker@cyberlab:~$ ${trimmed}` }])
    setCmdHistory(h => [trimmed, ...h.slice(0, 49)])
    setHistIdx(-1)
    setInput('')

    if (trimmed === 'clear') { setHistory([]); return }

    setLoading(true)
    try {
      const res = await api.post('/terminal/execute', {
        session_id: sessionId,
        command: trimmed,
        lab_slug: labSlug,
      })
      const output = res.data.output || ''
      setHistory(h => [...h, { type: 'output', text: output }])
    } catch (e) {
      setHistory(h => [...h, { type: 'error', text: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { run(input); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, cmdHistory.length - 1)
      setHistIdx(idx)
      setInput(cmdHistory[idx] || '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : cmdHistory[idx] || '')
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const cmds = ['help', 'nmap', 'sqlmap', 'curl', 'john', 'hashcat', 'steghide', 'binwalk', 'exiftool', 'strings', 'ls', 'cat', 'python3', 'burpsuite', 'base64', 'rot13']
      const match = cmds.find(c => c.startsWith(input))
      if (match) setInput(match)
    }
  }

  const containerStyle = fullscreen ? {
    position: 'fixed', inset: 0, zIndex: 999, borderRadius: 0,
    background: '#0a0e1a', display: 'flex', flexDirection: 'column',
  } : {
    background: '#0a0e1a', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
    height: '100%', minHeight: 360,
  }

  return (
    <div style={containerStyle} onClick={() => inputRef.current?.focus()}>
      {/* Titlebar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid #1a2235',
        background: '#0d1220', borderRadius: fullscreen ? 0 : '12px 12px 0 0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', cursor: 'pointer' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', cursor: 'pointer' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <TerminalIcon size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              hacker@cyberlab — {labSlug}
            </span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setFullscreen(!fullscreen) }} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
        }}>
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Output area */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px 16px',
        fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7,
      }}>
        {history.map((item, i) => (
          <div key={i} style={{
            color: item.type === 'input' ? 'var(--accent)' :
              item.type === 'error' ? 'var(--red)' :
                item.type === 'system' ? '#6a8fb5' : 'var(--green)',
            marginBottom: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {item.text}
          </div>
        ))}

        {loading && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ animation: 'blink 0.5s infinite' }}>▋</span> Processing...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        borderTop: '1px solid #1a2235', background: '#0d1220',
        borderRadius: fullscreen ? 0 : '0 0 12px 12px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', flexShrink: 0 }}>
          hacker@cyberlab:~$
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)',
            caretColor: 'var(--accent)', padding: 0,
          }}
          placeholder="Type a command... (Tab to autocomplete)"
        />
        {loading && <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}
