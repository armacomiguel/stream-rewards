// src/pages/AlbumPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getUserInventory } from '@/lib/firestore'
import { UserInventoryItem, Rarity } from '@/types'
import CardItem from '@/components/shared/CardItem'
import { Search, Filter } from 'lucide-react'
import clsx from 'clsx'

type FilterRarity = 'all' | Rarity

export default function AlbumPage() {
  const { userProfile } = useAuth()
  const [inventory, setInventory] = useState<UserInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterRarity>('all')

  useEffect(() => {
    if (!userProfile) return
    getUserInventory(userProfile.id).then(inv => {
      setInventory(inv)
      setLoading(false)
    })
  }, [userProfile])

  const filtered = inventory.filter(item => {
    const card = item.card
    if (!card) return false
    if (filter !== 'all' && card.rarity !== filter) return false
    if (search && !card.name.toLowerCase().includes(search.toLowerCase()) &&
        !card.character.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalCards = inventory.reduce((a, i) => a + i.quantity, 0)
  const uniqueCards = inventory.length

  const filters: { value: FilterRarity; label: string }[] = [
    { value: 'all',    label: 'Todas' },
    { value: 'gold',   label: '🥇 Oro' },
    { value: 'silver', label: '🥈 Plata' },
    { value: 'bronze', label: '🥉 Bronce' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl text-white">Mi Álbum</h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">
          <span className="text-white">{uniqueCards}</span> cartas únicas ·{' '}
          <span className="text-white">{totalCards}</span> total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar carta o personaje..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-accent/40 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <Filter size={15} className="text-slate-500 self-center" />
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all',
                filter === f.value
                  ? 'bg-accent/15 text-accent-light border border-accent/20'
                  : 'bg-surface border border-border text-slate-400 hover:text-white hover:border-white/10'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="w-36 h-52 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎴</p>
          <p className="font-display font-bold text-xl text-white">
            {inventory.length === 0 ? 'Tu álbum está vacío' : 'Sin resultados'}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            {inventory.length === 0
              ? 'Canjea puntos para obtener tus primeras cartas'
              : 'Prueba con otro filtro o búsqueda'}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filtered.map(item => item.card && (
            <CardItem
              key={item.cardId}
              name={item.card.name}
              character={item.card.character}
              imageUrl={item.card.imageUrl}
              rarity={item.card.rarity}
              quantity={item.quantity}
              stockRemaining={item.card.stockRemaining}
              stockTotal={item.card.stockTotal}
              size="md"
            />
          ))}
        </div>
      )}
    </div>
  )
}
