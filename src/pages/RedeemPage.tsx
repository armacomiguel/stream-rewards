import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { redeemPack } from '@/lib/firestore'
import { PACKS, Pack, Card } from '@/types'
import CardItem from '@/components/shared/CardItem'
// CORREGIDO: Comilla cerrada en lucide-react
import { Gift, Loader2, Star, Zap, Crown } from 'lucide-react'
import clsx from 'clsx'

export default function RedeemPage() {
  const { userProfile } = useAuth()
  const [selected, setSelected] = useState<Pack>(PACKS[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Card[] | null>(null)
  const [error, setError] = useState('')

  const handleRedeem = async () => {
    if (!userProfile || loading) return
    
    setLoading(true)
    setError('')
    
    try {
      // 1. Llamada a la base de datos
      const cards = await redeemPack(userProfile.id, selected.id)
      
      // 2. Un pequeño delay artificial mejora la percepción de "apertura"
      // y evita que el cambio de pantalla sea demasiado brusco
      setTimeout(() => {
        setResult(cards);
        setLoading(false);
      }, 1600)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null);
    setError('');
  }

  const points = userProfile?.points ?? 0
  const canAfford = points >= selected.cost
  const packIcons = { basic: Star, premium: Zap, legendary: Crown }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl text-white">Canjear Puntos</h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">
          Tienes <span className="text-gold font-bold">{points.toLocaleString()} pts</span> disponibles
        </p>
      </div>

      {result ? (
        <div className="text-center animate-in fade-in duration-500">
          <h2 className="font-display font-bold text-2xl text-white mb-2">¡Cartas obtenidas!</h2>
          <p className="text-slate-400 text-sm font-mono mb-8">Sobre: {selected.name}</p>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {result.map((card, i) => (
              <div
                key={`${card.id}-${i}`}
                className="animate-in zoom-in duration-300 fill-mode-both"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <CardItem
                  name={card.name}
                  character={card.character}
                  imageUrl={card.imageUrl}
                  rarity={card.rarity}
                  size="lg"
                  isNew
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="px-8 py-3 bg-surface border border-border hover:border-accent/30 rounded-xl text-white font-display font-semibold transition-all active:scale-95"
          >
            Abrir otro sobre
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PACKS.map(pack => {
              const Icon = packIcons[pack.id as keyof typeof packIcons] ?? Star
              const isSelected = selected.id === pack.id
              const affordable = points >= pack.cost

              return (
                <button
                  key={pack.id}
                  onClick={() => setSelected(pack)}
                  disabled={loading}
                  className={clsx(
                    'relative text-left p-5 rounded-2xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(var(--color-accent),0.2)]'
                      : 'border-border bg-surface hover:border-white/15',
                    !affordable && 'opacity-60'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}

                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                    pack.id === 'legendary' ? 'bg-gold/20 border border-gold/30'
                    : pack.id === 'premium' ? 'bg-accent/20 border border-accent/30'
                    : 'bg-slate-700/50 border border-slate-600/30'
                  )}>
                    <Icon size={20} className={
                      pack.id === 'legendary' ? 'text-gold'
                      : pack.id === 'premium' ? 'text-accent-light'
                      : 'text-slate-400'
                    } />
                  </div>

                  <p className="font-display font-bold text-white text-lg">{pack.name}</p>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{pack.description}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={clsx(
                      'font-mono font-bold text-lg',
                      affordable ? 'text-gold' : 'text-slate-500'
                    )}>
                      {pack.cost} pts
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {pack.cardCount} {pack.cardCount > 1 ? 'cartas' : 'carta'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Probabilidades — {selected.name}</p>
            <div className="space-y-2">
              {([
                { rarity: 'bronze', label: '🥉 Bronce', color: 'bg-orange-400' },
                { rarity: 'silver', label: '🥈 Plata',  color: 'bg-slate-300' },
                { rarity: 'gold',   label: '🥇 Oro',    color: 'bg-gold'   },
              ] as const).map(({ rarity, label, color }) => {
                // CORREGIDO: Acceso seguro a las probabilidades
                const probabilities = { 
                  basic: { bronze: 70, silver: 25, gold: 5 }, 
                  premium: { bronze: 50, silver: 40, gold: 10 }, 
                  legendary: { bronze: 40, silver: 45, gold: 15 } 
                }
                const currentPackProbs = probabilities[selected.id as keyof typeof probabilities]
                const pct = currentPackProbs ? currentPackProbs[rarity] : 0

                return (
                  <div key={rarity} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-20">{label}</span>
                    <div className="flex-1 bg-black/30 rounded-full h-1.5">
                      <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs font-mono bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleRedeem}
            disabled={loading || !canAfford}
            className={clsx(
              'w-full py-4 rounded-2xl font-display font-bold text-xl transition-all duration-200 flex items-center justify-center gap-3',
              canAfford && !loading
                ? 'bg-accent hover:bg-accent/90 text-white shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-surface border border-border text-slate-600 cursor-not-allowed'
            )}
          >
            {loading ? (
              <><Loader2 size={22} className="animate-spin" /> Abriendo sobre...</>
            ) : !canAfford ? (
              `Faltan ${(selected.cost - points).toLocaleString()} pts`
            ) : (
              <><Gift size={22} /> Abrir {selected.name}</>
            )}
          </button>
        </>
      )}
    </div>
  )
}