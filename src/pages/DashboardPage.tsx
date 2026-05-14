// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getUserTransactions, getUserInventory } from '@/lib/firestore'
import { Transaction, UserInventoryItem } from '@/types'
import { Gift, Zap, BookOpen, TrendingUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [inventory, setInventory] = useState<UserInventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile) return
    Promise.all([
      getUserTransactions(userProfile.id, 5),
      getUserInventory(userProfile.id),
    ]).then(([txs, inv]) => {
      setTransactions(txs)
      setInventory(inv)
      setLoading(false)
    })
  }, [userProfile])

  const totalCards = inventory.reduce((a, i) => a + i.quantity, 0)
  const goldCards = inventory.filter(i => i.card?.rarity === 'gold').reduce((a, i) => a + i.quantity, 0)
  const silverCards = inventory.filter(i => i.card?.rarity === 'silver').reduce((a, i) => a + i.quantity, 0)

  const formatDate = (val: unknown) => {
    if (!val) return '—'
    const date = (val as { toDate?: () => Date }).toDate?.() ?? new Date(val as string)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const txLabel = (tx: Transaction) => {
    if (tx.type === 'grant') return `+${tx.pointsDelta} pts — ${tx.note || 'Regalo'}`
    if (tx.type === 'redeem') return `Sobre canjeado (${tx.packType})`
    if (tx.type === 'craft') return 'Carta mejorada (craft)'
    return tx.type
  }

  const txColor = (tx: Transaction) => {
    if (tx.type === 'grant') return 'text-emerald-400'
    if (tx.type === 'redeem') return 'text-accent-light'
    return 'text-amber-400'
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl text-white">
          Bienvenido, <span className="text-accent-light">{userProfile?.displayName}</span>
        </h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">Tu centro de recompensas del stream</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrendingUp size={20} className="text-accent-light" />}
          label="Puntos"
          value={userProfile?.points?.toLocaleString() ?? '0'}
          sub="disponibles"
          accent="accent"
        />
        <StatCard
          icon={<span className="text-xl">🎴</span>}
          label="Cartas"
          value={totalCards.toString()}
          sub="en colección"
          accent="purple"
        />
        <StatCard
          icon={<span className="text-xl">🥇</span>}
          label="Oro"
          value={goldCards.toString()}
          sub="cartas legendarias"
          accent="gold"
        />
        <StatCard
          icon={<span className="text-xl">🥈</span>}
          label="Plata"
          value={silverCards.toString()}
          sub="cartas raras"
          accent="silver"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickAction
          icon={<Gift size={22} className="text-accent-light" />}
          title="Canjear Puntos"
          desc="Abre sobres y obtén nuevas cartas"
          onClick={() => navigate('/redeem')}
          primary
        />
        <QuickAction
          icon={<BookOpen size={22} className="text-slate-300" />}
          title="Ver Álbum"
          desc="Revisa tu colección completa"
          onClick={() => navigate('/album')}
        />
        <QuickAction
          icon={<Zap size={22} className="text-amber-400" />}
          title="Craft"
          desc="Combina cartas para mejorarlas"
          onClick={() => navigate('/craft')}
        />
      </div>

      {/* Recent activity */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={16} className="text-slate-500" />
          <h2 className="font-display font-semibold text-lg text-white">Actividad Reciente</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-slate-500 font-mono text-sm text-center py-8">
            Sin actividad aún. ¡Canjea tu primer sobre!
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className={`text-sm font-mono ${txColor(tx)}`}>{txLabel(tx)}</span>
                <span className="text-xs text-slate-600 font-mono">{formatDate(tx.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub: string; accent: string
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{label}</span></div>
      <p className="font-display font-bold text-3xl text-white leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  )
}

function QuickAction({ icon, title, desc, onClick, primary = false }: {
  icon: React.ReactNode; title: string; desc: string; onClick: () => void; primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        primary
          ? 'bg-accent/10 border-accent/20 hover:bg-accent/15 hover:border-accent/30'
          : 'bg-surface border-border hover:border-white/10 hover:bg-white/5'
      }`}
    >
      <div className="mb-3">{icon}</div>
      <p className="font-display font-semibold text-white text-lg">{title}</p>
      <p className="text-slate-400 text-sm mt-1">{desc}</p>
    </button>
  )
}
