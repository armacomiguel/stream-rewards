// src/pages/AdminPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import {
  getAllUsers, adminCreateUser, grantPoints,
  createCard, getAllCards, getRecentTransactions
} from '@/lib/firestore'
import { UserProfile, Card, Transaction, Rarity } from '@/types'
import { Users, CreditCard, History, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'users' | 'cards' | 'transactions'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'users',        icon: <Users size={16} />,      label: 'Usuarios'      },
    { id: 'cards',        icon: <CreditCard size={16} />, label: 'Cartas'        },
    { id: 'transactions', icon: <History size={16} />,    label: 'Transacciones' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl text-white">
          Admin Panel <span className="text-amber-400">⚙</span>
        </h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">Gestión del sistema de recompensas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border pb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all',
              tab === t.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'cards' && <CardsTab />}
      {tab === 'transactions' && <TransactionsTab />}
    </div>
  )
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────

function UsersTab() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', displayName: '', password: '', initialPoints: '0' })
  const [grantForm, setGrantForm] = useState<{ uid: string; amount: string; note: string } | null>(null)
  const [granting, setGranting] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getAllUsers().then(u => { setUsers(u); setLoading(false) })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMsg('')
    try {
      await adminCreateUser(form.username, form.password, form.displayName, parseInt(form.initialPoints) || 0)
      setMsg(`✓ Usuario "${form.username}" creado correctamente`)
      setForm({ username: '', displayName: '', password: '', initialPoints: '0' })
      setShowForm(false)
      const updated = await getAllUsers()
      setUsers(updated)
    } catch (err: unknown) {
      setMsg(`⚠ ${err instanceof Error ? err.message : 'Error al crear usuario'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantForm || !userProfile) return
    setGranting(true)
    try {
      await grantPoints(grantForm.uid, parseInt(grantForm.amount), grantForm.note, userProfile.displayName)
      setMsg(`✓ ${grantForm.amount} puntos otorgados`)
      setGrantForm(null)
      const updated = await getAllUsers()
      setUsers(updated)
    } catch (err: unknown) {
      setMsg(`⚠ ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setGranting(false)
    }
  }

  return (
    <div>
      {msg && (
        <p className={`text-sm font-mono px-4 py-3 rounded-xl mb-4 border ${
          msg.startsWith('✓') ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'
        }`}>{msg}</p>
      )}

      {/* Create user button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/20 hover:bg-accent/15 text-accent-light rounded-xl text-sm font-mono font-medium transition-all mb-4"
      >
        <Plus size={15} />
        Crear nuevo usuario
        {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
          <Field label="Username" value={form.username} onChange={v => setForm({...form, username: v})} placeholder="gamer123" mono />
          <Field label="Nombre para mostrar" value={form.displayName} onChange={v => setForm({...form, displayName: v})} placeholder="Gamer123" />
          <Field label="Contraseña" value={form.password} onChange={v => setForm({...form, password: v})} placeholder="••••••••" type="password" />
          <Field label="Puntos iniciales" value={form.initialPoints} onChange={v => setForm({...form, initialPoints: v})} placeholder="0" type="number" />
          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating || !form.username || !form.password || !form.displayName}
              className="px-6 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-surface disabled:border disabled:border-border disabled:text-slate-600 text-white rounded-xl font-mono text-sm font-medium transition-all flex items-center gap-2"
            >
              {creating ? <><Loader2 size={14} className="animate-spin" />Creando...</> : <><Plus size={14} />Crear usuario</>}
            </button>
          </div>
        </form>
      )}

      {/* Grant points modal */}
      {grantForm && (
        <form onSubmit={handleGrant} className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mb-6">
          <p className="text-xs font-mono text-gold uppercase tracking-widest mb-4">Otorgar puntos</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Cantidad" value={grantForm.amount} onChange={v => setGrantForm({...grantForm, amount: v})} placeholder="100" type="number" />
            <div className="col-span-2">
              <Field label="Nota (opcional)" value={grantForm.note} onChange={v => setGrantForm({...grantForm, note: v})} placeholder="Por ver el stream..." />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={granting || !grantForm.amount}
              className="px-4 py-2 bg-gold/20 border border-gold/30 text-gold rounded-lg text-sm font-mono hover:bg-gold/30 transition-all flex items-center gap-2">
              {granting ? <Loader2 size={13} className="animate-spin" /> : null}
              Otorgar
            </button>
            <button type="button" onClick={() => setGrantForm(null)}
              className="px-4 py-2 bg-surface border border-border text-slate-400 rounded-lg text-sm font-mono hover:text-white transition-all">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Usuario', 'Nombre', 'Puntos', 'Rol', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-300">@{user.username}</td>
                  <td className="px-4 py-3 text-white font-medium">{user.displayName}</td>
                  <td className="px-4 py-3 font-mono text-gold font-bold">{user.points?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-mono px-2 py-0.5 rounded-full border',
                      user.role === 'admin' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-slate-400 bg-white/5 border-white/10'
                    )}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setGrantForm({ uid: user.id, amount: '', note: '' })}
                      className="text-xs font-mono text-gold hover:text-gold/80 bg-gold/10 hover:bg-gold/20 border border-gold/20 px-2.5 py-1 rounded-lg transition-all"
                    >
                      + Puntos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── CARDS TAB ────────────────────────────────────────────────────────────────

function CardsTab() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    name: '', character: '', imageUrl: '',
    rarity: 'bronze' as Rarity, serie: '',
    season: 'S1', stockTotal: '100', active: true
  })

  useEffect(() => {
    getAllCards().then(c => { setCards(c); setLoading(false) })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMsg('')
    try {
      await createCard({
        name: form.name, character: form.character,
        imageUrl: form.imageUrl, rarity: form.rarity,
        serie: form.serie, season: form.season,
        stockTotal: parseInt(form.stockTotal),
        stockRemaining: parseInt(form.stockTotal),
        active: form.active,
      })
      setMsg(`✓ Carta "${form.name}" creada`)
      setShowForm(false)
      setForm({ name: '', character: '', imageUrl: '', rarity: 'bronze', serie: '', season: 'S1', stockTotal: '100', active: true })
      const updated = await getAllCards()
      setCards(updated)
    } catch (err: unknown) {
      setMsg(`⚠ ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setCreating(false)
    }
  }

  const rarityColors: Record<Rarity, string> = {
    bronze: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    silver: 'text-slate-300 bg-slate-400/10 border-slate-400/20',
    gold:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  }

  return (
    <div>
      {msg && (
        <p className={`text-sm font-mono px-4 py-3 rounded-xl mb-4 border ${
          msg.startsWith('✓') ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'
        }`}>{msg}</p>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/20 hover:bg-accent/15 text-accent-light rounded-xl text-sm font-mono font-medium transition-all mb-4"
      >
        <Plus size={15} />Nueva carta {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
          <Field label="Nombre" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Carta del Caos" />
          <Field label="Personaje" value={form.character} onChange={v => setForm({...form, character: v})} placeholder="Jett" />
          <Field label="URL de imagen" value={form.imageUrl} onChange={v => setForm({...form, imageUrl: v})} placeholder="https://..." />
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Rareza</label>
            <select
              value={form.rarity}
              onChange={e => setForm({...form, rarity: e.target.value as Rarity})}
              className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-accent/40"
            >
              <option value="bronze">🥉 Bronce</option>
              <option value="silver">🥈 Plata</option>
              <option value="gold">🥇 Oro</option>
            </select>
          </div>
          <Field label="Serie / Álbum" value={form.serie} onChange={v => setForm({...form, serie: v})} placeholder="Valorant S1" />
          <Field label="Temporada" value={form.season} onChange={v => setForm({...form, season: v})} placeholder="S1" />
          <Field label="Stock total" value={form.stockTotal} onChange={v => setForm({...form, stockTotal: v})} placeholder="100" type="number" />
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-slate-500 uppercase tracking-widest">Activa</label>
            <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})}
              className="w-4 h-4 rounded accent-violet-600" />
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={creating || !form.name || !form.character}
              className="px-6 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl font-mono text-sm font-medium transition-all flex items-center gap-2">
              {creating ? <><Loader2 size={14} className="animate-spin" />Creando...</> : <><Plus size={14} />Crear carta</>}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Nombre', 'Personaje', 'Rareza', 'Serie', 'Stock', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card.id} className="border-b border-border/50 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{card.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{card.character}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-mono px-2 py-0.5 rounded-full border', rarityColors[card.rarity])}>
                      {card.rarity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{card.serie}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('font-mono text-xs', card.stockRemaining === 0 ? 'text-red-400' : 'text-emerald-400')}>
                      {card.stockRemaining}/{card.stockTotal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-mono', card.active ? 'text-emerald-400' : 'text-slate-600')}>
                      {card.active ? '● activa' : '○ inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── TRANSACTIONS TAB ────────────────────────────────────────────────────────

function TransactionsTab() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentTransactions(30).then(t => { setTxs(t); setLoading(false) })
  }, [])

  const formatDate = (val: unknown) => {
    if (!val) return '—'
    const date = (val as { toDate?: () => Date }).toDate?.() ?? new Date(val as string)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const typeColors: Record<string, string> = {
    grant:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    redeem: 'text-accent-light bg-accent/10 border-accent/20',
    craft:  'text-amber-400 bg-amber-400/10 border-amber-400/20',
  }

  return (
    <div>
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Usuario', 'Tipo', 'Puntos', 'Cartas', 'Fecha'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map(tx => (
                <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-300">@{tx.username}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-mono px-2 py-0.5 rounded-full border', typeColors[tx.type] || 'text-slate-400 bg-white/5 border-white/10')}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className={tx.pointsDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {tx.pointsDelta >= 0 ? '+' : ''}{tx.pointsDelta}
                    </span>
                    <span className="text-slate-600 ml-1">→ {tx.pointsAfter}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                    {tx.cardsObtained?.length ? `${tx.cardsObtained.length} carta(s)` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Shared Field ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text', mono = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-accent/40 transition-all',
          mono && 'font-mono'
        )}
      />
    </div>
  )
}
