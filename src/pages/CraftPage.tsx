// src/pages/CraftPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getUserInventory, getAllCards, craftCard } from '@/lib/firestore'
import { UserInventoryItem, Card } from '@/types'
import CardItem from '@/components/shared/CardItem'
import { Zap, Loader2, ArrowRight } from 'lucide-react'

export default function CraftPage() {
  const { userProfile } = useAuth()
  const [inventory, setInventory] = useState<UserInventoryItem[]>([])
  const [allCards, setAllCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<UserInventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [crafting, setCrafting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!userProfile) return
    Promise.all([getUserInventory(userProfile.id), getAllCards()]).then(([inv, cards]) => {
      setInventory(inv)
      setAllCards(cards)
      setLoading(false)
    })
  }, [userProfile])

  // Cards with at least 3 copies (craftable)
  const craftable = inventory.filter(i => i.quantity >= 3 && i.card?.rarity !== 'gold')

  const getTargetCard = (item: UserInventoryItem): Card | null => {
    if (!item.card) return null
    const targetRarity = item.card.rarity === 'bronze' ? 'silver' : 'gold'
    // Find a card of the same character but higher rarity
    return allCards.find(c =>
      c.character === item.card!.character &&
      c.rarity === targetRarity &&
      c.stockRemaining > 0
    ) ?? allCards.find(c => c.rarity === targetRarity && c.stockRemaining > 0) ?? null
  }

  const handleCraft = async () => {
    if (!selected || !userProfile) return
    const target = getTargetCard(selected)
    if (!target) return
    setCrafting(true)
    setMessage('')
    try {
      await craftCard(userProfile.id, selected.cardId, target.id)
      const [inv] = await Promise.all([getUserInventory(userProfile.id)])
      setInventory(inv)
      setMessage(`¡Obtuviste "${target.name}" (${target.rarity})!`)
      setSuccess(true)
      setSelected(null)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al hacer craft')
      setSuccess(false)
    } finally {
      setCrafting(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl text-white">Craft</h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">Combina 3 cartas iguales para mejorar su rareza</p>
      </div>

      {/* Recipe info */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-8 flex items-center gap-6">
        <div className="text-center">
          <span className="text-2xl">🥉</span>
          <p className="text-xs font-mono text-slate-500 mt-1">3× Bronce</p>
        </div>
        <ArrowRight className="text-accent-light flex-shrink-0" size={20} />
        <div className="text-center">
          <span className="text-2xl">🥈</span>
          <p className="text-xs font-mono text-slate-500 mt-1">1× Plata</p>
        </div>
        <div className="w-px h-10 bg-border mx-2" />
        <div className="text-center">
          <span className="text-2xl">🥈</span>
          <p className="text-xs font-mono text-slate-500 mt-1">3× Plata</p>
        </div>
        <ArrowRight className="text-accent-light flex-shrink-0" size={20} />
        <div className="text-center">
          <span className="text-2xl">🥇</span>
          <p className="text-xs font-mono text-slate-500 mt-1">1× Oro</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent-light" />
        </div>
      ) : craftable.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <p className="text-4xl mb-3">⚗️</p>
          <p className="font-display font-bold text-xl text-white">Sin cartas para craftear</p>
          <p className="text-slate-500 text-sm mt-2">Necesitas 3 copias de la misma carta</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
            Selecciona una carta para craftear
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            {craftable.map(item => item.card && (
              <button
                key={item.cardId}
                onClick={() => setSelected(selected?.cardId === item.cardId ? null : item)}
                className={`relative transition-all duration-200 rounded-xl ${
                  selected?.cardId === item.cardId
                    ? 'ring-2 ring-accent scale-105'
                    : 'hover:scale-102 opacity-80 hover:opacity-100'
                }`}
              >
                <CardItem
                  name={item.card.name}
                  character={item.card.character}
                  imageUrl={item.card.imageUrl}
                  rarity={item.card.rarity}
                  quantity={item.quantity}
                  size="md"
                />
              </button>
            ))}
          </div>

          {selected && (
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-4">
              <p className="text-xs font-mono text-slate-400 mb-3">Vista previa del craft:</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs font-mono text-slate-500 mb-2">3×</p>
                  <CardItem
                    name={selected.card!.name}
                    character={selected.card!.character}
                    imageUrl={selected.card!.imageUrl}
                    rarity={selected.card!.rarity}
                    size="sm"
                  />
                </div>
                <ArrowRight className="text-accent-light flex-shrink-0" size={24} />
                {getTargetCard(selected) ? (
                  <div className="text-center">
                    <p className="text-xs font-mono text-slate-500 mb-2">1×</p>
                    <CardItem
                      name={getTargetCard(selected)!.name}
                      character={getTargetCard(selected)!.character}
                      imageUrl={getTargetCard(selected)!.imageUrl}
                      rarity={getTargetCard(selected)!.rarity}
                      size="sm"
                    />
                  </div>
                ) : (
                  <p className="text-red-400 text-sm font-mono">No hay carta destino disponible</p>
                )}
              </div>
            </div>
          )}

          {message && (
            <p className={`text-sm font-mono px-4 py-3 rounded-xl mb-4 border ${
              success
                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                : 'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {success ? '✓ ' : '⚠ '}{message}
            </p>
          )}

          <button
            onClick={handleCraft}
            disabled={!selected || crafting || !getTargetCard(selected!)}
            className="w-full py-4 rounded-2xl font-display font-bold text-xl transition-all flex items-center justify-center gap-3 bg-accent hover:bg-accent/90 disabled:bg-surface disabled:text-slate-600 disabled:border disabled:border-border text-white disabled:cursor-not-allowed"
          >
            {crafting ? (
              <><Loader2 size={22} className="animate-spin" /> Crafteando...</>
            ) : (
              <><Zap size={22} /> Hacer Craft</>
            )}
          </button>
        </>
      )}
    </div>
  )
}
