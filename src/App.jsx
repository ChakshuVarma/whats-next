import { useState, useEffect } from 'react'

const TIMES = ['15 min', '30 min', '1 hour', '2 hours', 'Half a day']
const ENERGIES = ['Low — scattered', 'Medium — okay', 'High — sharp']
const URGENCIES = ['Low', 'Medium', 'High', 'Critical']

const U_UNSEL = { Low: 'border-gray-700 text-gray-500', Medium: 'border-blue-900 text-blue-600', High: 'border-orange-900 text-orange-600', Critical: 'border-red-900 text-red-600' }
const U_SEL   = { Low: 'bg-gray-800 border-gray-600 text-gray-200', Medium: 'bg-blue-950 border-blue-600 text-blue-300', High: 'bg-orange-950 border-orange-600 text-orange-300', Critical: 'bg-red-950 border-red-600 text-red-300' }
const U_BADGE = { Low: 'bg-gray-900 text-gray-400 border-gray-700', Medium: 'bg-blue-950 text-blue-400 border-blue-800', High: 'bg-orange-950 text-orange-400 border-orange-800', Critical: 'bg-red-950 text-red-400 border-red-800' }
const U_DOT   = { Low: '#6b7280', Medium: '#3b82f6', High: '#f97316', Critical: '#ef4444' }
const U_GLOW  = { Low: 'rgba(107,114,128,0.12)', Medium: 'rgba(59,130,246,0.12)', High: 'rgba(249,115,22,0.12)', Critical: 'rgba(239,68,68,0.12)' }

const LOADING_QUOTES = {
  'Low — scattered': ['A small step forward is still forward.', "You don't have to see the whole staircase. Just take the first step.", 'Done is better than perfect. Start somewhere.'],
  'Medium — okay':   ['Clarity comes from action, not thought.', "You're closer than you think. Keep moving.", "The hardest part is starting. You're already here."],
  'High — sharp':    ['This is your window. Use it.', "Energy is rare. Don't waste it on the wrong thing.", "You're in flow — let's point it at what matters."],
}

const PROGRESS_QUOTES = [
  { min: 1,  max: 2,  q: "Every journey starts with a single session. You've begun." },
  { min: 3,  max: 6,  q: "You're building a habit. The hardest part is behind you." },
  { min: 7,  max: 14, q: "A week of clarity. That's not luck — that's discipline." },
  { min: 15, max: 29, q: "You're in rare company. Most people never make it this far." },
  { min: 30, max: 999,q: "30+ sessions of intentional work. You've changed." },
]

function getProgressQuote(total) {
  return PROGRESS_QUOTES.find(p => total >= p.min && total <= p.max)?.q || "Start your first session to see your progress here."
}

function getStreak() {
  const d = JSON.parse(localStorage.getItem('wn_streak') || '{"count":0,"last":""}')
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (d.last === today) return d.count
  if (d.last === yesterday) return d.count
  return 0
}
function updateStreak() {
  const d = JSON.parse(localStorage.getItem('wn_streak') || '{"count":0,"last":""}')
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  let c = 1
  if (d.last === today) c = d.count
  else if (d.last === yesterday) c = d.count + 1
  localStorage.setItem('wn_streak', JSON.stringify({ count: c, last: today }))
  return c
}
function getSaved() { return JSON.parse(localStorage.getItem('wn_history') || '[]') }
function saveResult(result, goals) {
  const h = getSaved()
  h.unshift({ id: Date.now(), date: new Date().toLocaleDateString(), dateStr: new Date().toDateString(), goals: goals.map(g => `${g.text} (${g.urgency})`), result })
  localStorage.setItem('wn_history', JSON.stringify(h.slice(0, 50)))
}

function getActivityData(history) {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const dateStr = d.toDateString()
    const count = history.filter(h => h.dateStr === dateStr).length
    days.push({ label, dateStr, count })
  }
  return days
}

function getUrgencyBreakdown(history) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  history.forEach(h => {
    const u = h.result?.next_action?.urgency
    if (u && counts[u] !== undefined) counts[u]++
  })
  return counts
}

function getTopGoal(history) {
  const map = {}
  history.forEach(h => {
    h.goals?.forEach(g => {
      if (typeof g !== 'string') return
      const clean = g.replace(/\s*\(.*?\)\s*/g, '').trim()
      if (clean) map[clean] = (map[clean] || 0) + 1
    })
  })
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  return sorted[0] || null
}

function ActivityChart({ data, amber, border, sub }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 560, H = 120, BAR_W = 28, GAP = 12
  const total = BAR_W + GAP
  const startX = (W - data.length * total + GAP) / 2
  return (
    <svg viewBox={`0 0 ${W} ${H + 32}`} style={{ width: '100%', overflow: 'visible' }}>
      {data.map((d, i) => {
        const x = startX + i * total
        const barH = d.count === 0 ? 3 : Math.max(8, (d.count / max) * H)
        const y = H - barH
        const isToday = d.dateStr === new Date().toDateString()
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={4}
              fill={d.count > 0 ? amber : (isToday ? 'rgba(200,132,26,0.15)' : border)}
              opacity={d.count > 0 ? (isToday ? 1 : 0.65) : 1} />
            {d.count > 0 && (
              <text x={x + BAR_W / 2} y={y - 6} textAnchor="middle" fontSize={9} fill={amber} fontFamily="DM Mono, monospace">{d.count}</text>
            )}
            <text x={x + BAR_W / 2} y={H + 20} textAnchor="middle" fontSize={9}
              fill={isToday ? amber : sub} fontFamily="DM Mono, monospace">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SparkLine({ data, amber }) {
  if (data.length < 2) return null
  const cumulative = []
  let sum = 0
  data.forEach(d => { sum += d.count; cumulative.push(sum) })
  const max = Math.max(...cumulative, 1)
  const W = 560, H = 60
  const pts = cumulative.map((v, i) => {
    const x = (i / (cumulative.length - 1)) * W
    const y = H - (v / max) * H
    return [x, y]
  })
  const path = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`
    const prev = pts[i - 1]
    const cx = (prev[0] + p[0]) / 2
    return `C${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`
  }).join(' ')
  const area = `${path} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={amber} stopOpacity="0.2" />
          <stop offset="100%" stopColor={amber} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke={amber} strokeWidth="1.5" strokeLinecap="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill={amber} opacity={0.7} />)}
    </svg>
  )
}

function UrgencyDonut({ counts }) {
  const colors = { Critical: '#ef4444', High: '#f97316', Medium: '#3b82f6', Low: '#6b7280' }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#7a7870', fontFamily: 'DM Mono' }}>
      no data yet
    </div>
  )
  const R = 36, CX = 44, CY = 44, strokeW = 10
  const circumference = 2 * Math.PI * R
  let offset = 0
  const segments = Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => {
    const pct = v / total
    const seg = { key: k, pct, dashArray: pct * circumference, dashOffset: -offset * circumference, color: colors[k] }
    offset += pct
    return seg
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 88 88" style={{ width: 88, flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
        {segments.map(s => (
          <circle key={s.key} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${s.dashArray} ${circumference}`}
            strokeDashoffset={s.dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }} />
        ))}
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize={13} fontWeight="500" fill="rgba(222,218,210,0.9)" fontFamily="DM Mono">{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[k], flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: '#7a7870' }}>{k}</span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: '#dedad2', marginLeft: 'auto' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('onboarding')
  const [tab, setTab] = useState('form')
  const [dark, setDark] = useState(true)
  const [goals, setGoals] = useState([{ text: '', urgency: '' }])
  const [time, setTime] = useState('')
  const [energy, setEnergy] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState({})
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [expandedEntry, setExpandedEntry] = useState(null)

  useEffect(() => {
    if (localStorage.getItem('wn_onboarded')) setScreen('main')
    setStreak(getStreak())
    setHistory(getSaved())
    const s = localStorage.getItem('wn_dark')
    if (s !== null) setDark(s === 'true')
  }, [])

  const toggleDark = () => setDark(d => { localStorage.setItem('wn_dark', String(!d)); return !d })

  const C = {
    bg:       dark ? '#0c0c0b' : '#f7f5f0',
    surface:  dark ? '#131312' : '#ffffff',
    surface2: dark ? '#1c1c1a' : '#eeece8',
    border:   dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    borderMd: dark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.13)',
    text:     dark ? '#dedad2' : '#1c1c1a',
    sub:      dark ? '#7a7870' : '#7a7870',
    input:    dark ? '#181816' : '#eeece8',
    amber:    '#c8841a',
    amberBg:  dark ? 'rgba(200,132,26,0.1)' : 'rgba(200,132,26,0.08)',
  }

  const updateText = (i, v) => { const u = [...goals]; u[i].text = v; setGoals(u) }
  const updateUrg  = (i, u) => { const g = [...goals]; g[i].urgency = u; setGoals(g) }
  const addGoal    = () => setGoals([...goals, { text: '', urgency: '' }])
  const removeGoal = (i) => { const u = goals.filter((_, x) => x !== i); setGoals(u.length ? u : [{ text: '', urgency: '' }]) }
  const canSubmit  = goals.some(g => g.text.trim() && g.urgency) && time && energy

  const reset = () => { setResult(null); setError(''); setGoals([{ text: '', urgency: '' }]); setTime(''); setEnergy(''); setDone({}); setTab('form') }
  const toggleDone = (gi, si) => { const k = `${gi}-${si}`; setDone(p => ({ ...p, [k]: !p[k] })) }

  const copyAll = () => {
    let t = `NEXT ACTION:\n${result.next_action.action}\n\nWhy: ${result.next_action.why}\n\nTO-DO LIST:\n`
    result.todo_list.forEach(item => {
      t += `\n${item.goal} [${item.urgency}]\n`
      item.steps.forEach((s, i) => { t += `  ${i+1}. ${s}\n` })
      item.tips.forEach(tip => { t += `  → ${tip}\n` })
    })
    navigator.clipboard.writeText(t)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  const shareWA    = () => window.open(`https://wa.me/?text=${encodeURIComponent(`My next action: ${result.next_action.action}\n\n${result.next_action.why}`)}`, '_blank')
  const shareEmail = () => window.open(`mailto:?subject=${encodeURIComponent('My Action Plan')}&body=${encodeURIComponent(`Next Action: ${result.next_action.action}\n\nWhy: ${result.next_action.why}`)}`)

  const handleSubmit = async () => {
    setLoadingQuote((LOADING_QUOTES[energy] || LOADING_QUOTES['Medium — okay'])[Math.floor(Math.random() * 3)])
    setLoading(true); setError(''); setResult(null)
    const filled = goals.filter(g => g.text.trim() && g.urgency)
    const prompt = `You are a focused productivity coach. The user has multiple goals with urgency levels.

User's goals and urgency:
${filled.map((g, i) => `${i+1}. "${g.text}" — Urgency: ${g.urgency}`).join('\n')}

Available time: ${time}
Current energy: ${energy}

Respond ONLY with raw JSON, no markdown, no backticks:
{
  "next_action": {
    "action": "The single most important thing to do right now",
    "goal": "Which goal this belongs to",
    "urgency": "Critical/High/Medium/Low",
    "why": "Why this is the most important right now",
    "time_estimate": "e.g. 20 minutes"
  },
  "todo_list": [
    {
      "goal": "Goal name",
      "urgency": "Critical/High/Medium/Low",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "tips": ["Tip 1", "Tip 2"]
    }
  ]
}`
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'API error')
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim())
      const ns = updateStreak(); setStreak(ns)
      saveResult(parsed, filled); setHistory(getSaved())
      setResult(parsed); setTab('result')
    } catch (e) { setError('Something went wrong: ' + e.message) }
    finally { setLoading(false) }
  }

  const Label = ({ children }) => (
    <p className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: C.sub }}>{children}</p>
  )

  const NavBar = () => (
    <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0"
      style={{ borderBottom: `0.5px solid ${C.border}` }}>
      <div className="flex items-center gap-1">
        {['form', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="font-mono-custom text-xs px-4 py-2 rounded-lg transition-all"
            style={{
              background: tab === t ? C.surface2 : 'transparent',
              color: tab === t ? C.text : C.sub,
              border: tab === t ? `0.5px solid ${C.borderMd}` : '0.5px solid transparent'
            }}>
            {t === 'form' ? '⊹ focus' : '◎ history'}
          </button>
        ))}
        {result && (
          <button onClick={() => setTab('result')}
            className="font-mono-custom text-xs px-4 py-2 rounded-lg transition-all"
            style={{
              background: tab === 'result' ? C.surface2 : 'transparent',
              color: tab === 'result' ? C.amber : C.sub,
              border: tab === 'result' ? `0.5px solid ${C.borderMd}` : '0.5px solid transparent'
            }}>
            ● result
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {streak > 0 && <span className="font-mono-custom text-xs" style={{ color: C.amber }}>🔥 {streak}d</span>}
        <button onClick={toggleDark} className="font-mono-custom text-xs px-3 py-1.5 rounded-full transition-all"
          style={{ border: `0.5px solid ${C.border}`, color: C.sub, background: C.surface2 }}>
          {dark ? '◑' : '●'}
        </button>
      </div>
    </div>
  )

  // ── ONBOARDING ───────────────────────────────────────────────────────────────
  if (screen === 'onboarding') return (
    <div className="grain min-h-screen flex items-center justify-center p-6" style={{ background: C.bg, color: C.text }}>
      <div className="w-full max-w-sm">
        <div className="animate-fade-up mb-10">
          <p className="font-mono-custom text-xs tracking-widest mb-5" style={{ color: C.amber }}>clarity engine</p>
          <h1 className="font-display leading-tight mb-3" style={{ fontSize: 44, color: C.text }}>
            What should<br /><em>you</em> do next?
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: C.sub }}>
            Most people aren't lazy — they're just stuck without a clear next move.
          </p>
        </div>
        <div className="space-y-2 mb-8">
          {[
            ['01', 'Add your goals', "List what you're working on + how urgent each is"],
            ['02', 'Share your state', 'Time available, energy level — be honest'],
            ['03', 'Get one action', 'Not a list of 20. The single move that matters most.'],
          ].map(([n, title, desc], i) => (
            <div key={i} className={`animate-fade-up delay-${i+1} rounded-xl p-4 flex gap-3`}
              style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
              <span className="font-mono-custom text-xs mt-0.5 flex-shrink-0" style={{ color: C.amber }}>{n}</span>
              <div>
                <p className="font-display text-base mb-0.5" style={{ color: C.text }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.sub }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { localStorage.setItem('wn_onboarded', 'true'); setScreen('main') }}
          className="btn-glow animate-fade-up delay-4 w-full py-3.5 rounded-xl font-display text-lg transition-all"
          style={{ background: C.amber, color: '#fff', border: 'none' }}>
          Let's get unstuck →
        </button>
      </div>
    </div>
  )

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="grain min-h-screen flex flex-col items-center justify-center gap-8 p-8" style={{ background: C.bg }}>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${C.border}` }} />
        <div className="absolute inset-0 rounded-full"
          style={{ border: '1.5px solid transparent', borderTopColor: C.amber, animation: 'spin 0.85s linear infinite' }} />
      </div>
      <div className="text-center max-w-xs animate-fade-in">
        <p className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: C.amber }}>while you wait</p>
        <p className="font-display leading-relaxed" style={{ fontSize: 22, color: C.text, fontStyle: 'italic' }}>
          "{loadingQuote}"
        </p>
        <div className="flex justify-center gap-1.5 mt-6">
          {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full"
            style={{ background: C.amber, animation: `pulse-dot 1.1s ease-in-out ${i*0.18}s infinite` }} />)}
        </div>
      </div>
      <p className="font-mono-custom text-xs" style={{ color: C.sub }}>reading your situation...</p>
    </div>
  )

  const HistoryTab = () => {
    const activityData = getActivityData(history)
    const urgencyCounts = getUrgencyBreakdown(history)
    const topGoal = getTopGoal(history)
    const total = history.length
    const progressQuote = getProgressQuote(total)
    const activeDays = activityData.filter(d => d.count > 0).length
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : 0

    return (
      <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: 'none' }}>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-display text-2xl" style={{ color: C.text, fontStyle: 'italic' }}>No sessions yet</p>
            <p className="font-mono-custom text-xs" style={{ color: C.sub }}>Complete your first session to see progress here.</p>
            <button onClick={() => setTab('form')} className="font-mono-custom text-xs px-4 py-2 rounded-lg transition-all"
              style={{ background: C.amber, color: '#fff', border: 'none' }}>start now →</button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 mb-4 animate-fade-up"
              style={{ background: C.surface, border: `0.5px solid rgba(200,132,26,0.2)` }}>
              <p className="font-mono-custom text-xs tracking-widest mb-3" style={{ color: C.amber }}>your progress</p>
              <p className="font-display leading-relaxed" style={{ fontSize: 20, color: C.text, fontStyle: 'italic' }}>
                "{progressQuote}"
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-up delay-1">
              {[
                { label: 'total sessions', value: total, icon: '◎' },
                { label: 'day streak', value: streak, icon: '🔥' },
                { label: 'active days', value: activeDays, icon: '◈' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center"
                  style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
                  <p style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</p>
                  <p className="font-display" style={{ fontSize: 28, color: C.text, lineHeight: 1 }}>{s.value}</p>
                  <p className="font-mono-custom text-xs mt-1" style={{ color: C.sub }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 mb-4 animate-fade-up delay-2"
              style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
              <p className="font-mono-custom text-xs tracking-widest mb-1" style={{ color: C.sub }}>daily activity — last 14 days</p>
              <p className="font-mono-custom text-xs mb-5" style={{ color: C.amber }}>{avgPerDay} avg sessions / active day</p>
              <ActivityChart data={activityData} amber={C.amber} border={C.border} sub={C.sub} text={C.text} />
            </div>

            <div className="rounded-2xl p-6 mb-4 animate-fade-up delay-3"
              style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
              <p className="font-mono-custom text-xs tracking-widest mb-1" style={{ color: C.sub }}>cumulative sessions</p>
              <p className="font-mono-custom text-xs mb-5" style={{ color: C.amber }}>your growth curve</p>
              <SparkLine data={activityData} amber={C.amber} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up delay-4">
              <div className="rounded-2xl p-5" style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
                <p className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: C.sub }}>urgency mix</p>
                <UrgencyDonut counts={urgencyCounts} />
              </div>
              <div className="rounded-2xl p-5" style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
                <p className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: C.sub }}>top goal</p>
                {topGoal ? (
                  <>
                    <p className="font-display leading-snug mb-2" style={{ fontSize: 16, color: C.text }}>{topGoal[0]}</p>
                    <p className="font-mono-custom text-xs" style={{ color: C.amber }}>{topGoal[1]} session{topGoal[1] !== 1 ? 's' : ''}</p>
                  </>
                ) : <p className="font-mono-custom text-xs" style={{ color: C.sub }}>—</p>}
              </div>
            </div>

            <div className="animate-fade-up delay-5 mb-8">
              <p className="font-mono-custom text-xs tracking-widest mb-3" style={{ color: C.sub }}>all sessions</p>
              {history.map((entry, i) => (
                <div key={entry.id} className="rounded-xl mb-2 overflow-hidden cursor-pointer transition-all"
                  style={{ background: C.surface, border: `0.5px solid ${expandedEntry === i ? C.borderMd : C.border}` }}
                  onClick={() => setExpandedEntry(expandedEntry === i ? null : i)}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: U_DOT[entry.result?.next_action?.urgency] || C.sub }} />
                      <div>
                        <p className="text-sm" style={{ color: C.text }}>{entry.result?.next_action?.action}</p>
                        <p className="font-mono-custom text-xs mt-0.5" style={{ color: C.sub }}>{entry.date}</p>
                      </div>
                    </div>
                    <span className="font-mono-custom text-xs" style={{ color: C.sub }}>{expandedEntry === i ? '▲' : '▼'}</span>
                  </div>
                  {expandedEntry === i && (
                    <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: `0.5px solid ${C.border}` }}>
                      <p className="text-xs leading-relaxed mt-3 mb-3" style={{ color: C.sub }}>
                        {entry.result?.next_action?.why}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.goals?.map((g, j) => (
                          <span key={j} className="font-mono-custom text-xs px-2.5 py-1 rounded-full"
                            style={{ background: C.surface2, color: C.sub, border: `0.5px solid ${C.border}` }}>
                            {typeof g === 'string' ? g : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const ResultTab = () => {
    if (!result) return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="font-display text-2xl" style={{ color: C.text, fontStyle: 'italic' }}>No result yet</p>
        <button onClick={() => setTab('form')} className="font-mono-custom text-xs px-4 py-2 rounded-lg"
          style={{ background: C.amber, color: '#fff', border: 'none' }}>go to form →</button>
      </div>
    )

    const todos = result.todo_list || []
    const col1 = todos.filter((_, i) => i % 2 === 0)
    const col2 = todos.filter((_, i) => i % 2 === 1)

    const TodoCard = ({ item, ci, ri, order }) => (
      <div className="animate-fade-up rounded-2xl p-5 mb-3"
        style={{ background: C.surface, border: `0.5px solid ${C.border}`, animationDelay: `${(ci * 2 + ri) * 0.07 + 0.1}s` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-custom text-xs px-2 py-0.5 rounded-full"
              style={{ background: C.amberBg, color: C.amber }}>#{order}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: U_DOT[item.urgency] }} />
            <span className={`font-mono-custom text-xs px-2 py-0.5 rounded-full border ${U_BADGE[item.urgency]}`}>{item.urgency}</span>
          </div>
        </div>
        <h3 className="font-display text-base leading-snug mb-3" style={{ color: C.text }}>{item.goal}</h3>
        <p className="font-mono-custom text-xs tracking-widest mb-2" style={{ color: C.sub }}>steps</p>
        <ul className="mb-3 space-y-1.5">
          {item.steps.map((step, j) => {
            const k = `${ci * 10 + ri}-${j}`
            const isDone = done[k]
            return (
              <li key={j} onClick={() => toggleDone(ci * 10 + ri, j)}
                className={`flex items-start gap-2 text-xs cursor-pointer ${isDone ? 'opacity-30' : ''}`}>
                <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center mt-0.5 transition-all"
                  style={{ border: isDone ? 'none' : `1px solid ${C.borderMd}`, background: isDone ? C.amber : 'transparent', fontSize: 8, color: isDone ? '#fff' : 'transparent' }}>✓</span>
                <span style={{ color: isDone ? C.sub : C.text, textDecoration: isDone ? 'line-through' : 'none', transition: 'all 0.2s', lineHeight: 1.5 }}>{step}</span>
              </li>
            )
          })}
        </ul>
        <p className="font-mono-custom text-xs tracking-widest mb-1.5" style={{ color: C.sub }}>tips</p>
        <ul className="space-y-1">
          {item.tips.map((tip, j) => (
            <li key={j} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: C.sub }}>
              <span style={{ color: C.amber, flexShrink: 0 }}>→</span>{tip}
            </li>
          ))}
        </ul>
      </div>
    )

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-5 py-2 flex-shrink-0">
          <button onClick={reset} className="font-mono-custom text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ border: `0.5px solid ${C.border}`, color: C.sub, background: C.surface2 }}>← start over</button>
          <div style={{ flex: 1 }} />
          <button onClick={copyAll} className="font-mono-custom text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ border: `0.5px solid ${copied ? C.amber : C.border}`, color: copied ? C.amber : C.sub, background: C.surface2 }}>
            {copied ? '✓ copied' : '↗ copy'}</button>
          <button onClick={shareWA} className="font-mono-custom text-xs px-3 py-1.5 rounded-full"
            style={{ border: `0.5px solid ${C.border}`, color: C.sub, background: C.surface2 }}>whatsapp</button>
          <button onClick={shareEmail} className="font-mono-custom text-xs px-3 py-1.5 rounded-full"
            style={{ border: `0.5px solid ${C.border}`, color: C.sub, background: C.surface2 }}>email</button>
        </div>

        <div className="flex gap-3 flex-1 px-5 pb-5 min-h-0">

          {/* LEFT — main task #1 */}
          <div className="animate-fade-up rounded-2xl p-6 flex flex-col overflow-y-auto"
            style={{ width: '25%', flexShrink: 0, background: C.surface, border: `1px solid ${U_GLOW[result.next_action.urgency]}`, boxShadow: `0 0 40px ${U_GLOW[result.next_action.urgency]}`, scrollbarWidth: 'none' }}>
            <span className="font-mono-custom text-xs px-2.5 py-1 rounded-full self-start mb-4"
              style={{ background: C.amberBg, color: C.amber }}>#1 — do this first</span>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ background: U_DOT[result.next_action.urgency] }} />
              <span className={`font-mono-custom text-xs px-2.5 py-0.5 rounded-full border ${U_BADGE[result.next_action.urgency]}`}>{result.next_action.urgency}</span>
            </div>
            <h2 className="font-display leading-snug mb-4" style={{ fontSize: 22, color: C.text }}>{result.next_action.action}</h2>
            <p className="font-mono-custom text-xs mb-4" style={{ color: C.sub }}>from: {result.next_action.goal}</p>
            {result.next_action.time_estimate && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mb-5 self-start" style={{ background: C.amberBg }}>
                <span style={{ fontSize: 11 }}>⏱</span>
                <span className="font-mono-custom text-xs" style={{ color: C.amber }}>{result.next_action.time_estimate}</span>
              </div>
            )}
            <p className="text-sm leading-relaxed" style={{ color: C.sub }}>{result.next_action.why}</p>
          </div>

          {/* RIGHT — 2 col grid with order numbers */}
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {col1.map((item, ri) => (
                <TodoCard key={ri} item={item} ci={0} ri={ri} order={ri * 2 + 2} />
              ))}
            </div>
            {col2.length > 0 && (
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {col2.map((item, ri) => (
                  <TodoCard key={ri} item={item} ci={1} ri={ri} order={ri * 2 + 3} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const FormTab = () => (
    <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: 'none' }}>
      <div className="w-full max-w-lg mx-auto">
        <div className="mb-8 animate-fade-up">
          <p className="font-mono-custom text-xs tracking-widest mb-3" style={{ color: C.amber }}>clarity engine</p>
          <h1 className="font-display leading-tight mb-2" style={{ fontSize: 38, color: C.text }}>
            What should I<br /><em>do next?</em>
          </h1>
          <p className="text-sm" style={{ color: C.sub }}>You're not lazy. You're just stuck.</p>
        </div>

        <div className="rounded-2xl p-6 mb-3 animate-fade-up delay-1"
          style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
          <Label>your goals + urgency</Label>
          {goals.map((g, i) => (
            <div key={i} className="mb-5">
              <div className="flex gap-2 mb-2.5">
                <input value={g.text} onChange={e => updateText(i, e.target.value)}
                  placeholder="e.g. Launch my side project"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: C.input, color: C.text, border: `0.5px solid ${C.border}`, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(200,132,26,0.4)'}
                  onBlur={e => e.target.style.borderColor = C.border} />
                {goals.length > 1 && (
                  <button onClick={() => removeGoal(i)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all flex-shrink-0 mt-0.5"
                    style={{ border: `0.5px solid ${C.border}`, color: C.sub, background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#ef4444'; e.currentTarget.style.color='#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.sub }}>×</button>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {URGENCIES.map(u => (
                  <button key={u} onClick={() => updateUrg(i, u)}
                    className={`font-mono-custom px-3 py-1 rounded-full text-xs border transition-all ${g.urgency === u ? U_SEL[u] : U_UNSEL[u]}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addGoal} className="font-mono-custom text-xs transition-all" style={{ color: C.sub }}
            onMouseEnter={e => e.target.style.color = C.amber}
            onMouseLeave={e => e.target.style.color = C.sub}>+ add goal</button>
        </div>

        <div className="rounded-2xl p-6 mb-3 animate-fade-up delay-2"
          style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
          <Label>time available</Label>
          <div className="flex flex-wrap gap-2">
            {TIMES.map(t => (
              <button key={t} onClick={() => setTime(t)} className="px-4 py-2 rounded-full text-sm transition-all"
                style={{ background: time===t ? C.amber : 'transparent', color: time===t ? '#fff' : C.sub, border: `0.5px solid ${time===t ? C.amber : C.border}` }}>
                {t}</button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6 mb-5 animate-fade-up delay-3"
          style={{ background: C.surface, border: `0.5px solid ${C.border}` }}>
          <Label>current energy</Label>
          <div className="flex flex-wrap gap-2">
            {ENERGIES.map(e => (
              <button key={e} onClick={() => setEnergy(e)} className="px-4 py-2 rounded-full text-sm transition-all"
                style={{ background: energy===e ? C.amber : 'transparent', color: energy===e ? '#fff' : C.sub, border: `0.5px solid ${energy===e ? C.amber : C.border}` }}>
                {e}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl p-4 text-sm animate-fade-in"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#f87171', border: '0.5px solid rgba(220,38,38,0.2)' }}>
            {error}
          </div>
        )}

        <div className="mb-10 animate-fade-up delay-4">
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="btn-glow w-full py-3.5 rounded-xl font-display text-lg transition-all"
            style={{ background: canSubmit ? C.amber : C.surface2, color: canSubmit ? '#fff' : C.sub, cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none' }}>
            {canSubmit ? 'Show me my next move →' : 'fill in goals + urgency first'}
          </button>
          {goals.some(g => g.text.trim() && !g.urgency) && (
            <p className="font-mono-custom text-xs text-center mt-2" style={{ color: C.sub }}>pick urgency for each goal</p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="grain flex flex-col" style={{ height: '100vh', background: C.bg, color: C.text, overflow: 'hidden' }}>
      {NavBar()}
      {tab === 'form'    && FormTab()}
      {tab === 'result'  && ResultTab()}
      {tab === 'history' && HistoryTab()}
    </div>
  )
}