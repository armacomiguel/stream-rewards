// src/types/index.ts

export type Rarity = 'bronze' | 'silver' | 'gold'

export interface Card {
  id: string
  name: string
  character: string
  imageUrl: string
  rarity: Rarity
  serie: string
  season: string
  stockTotal: number
  stockRemaining: number
  active: boolean
  createdAt: Date
}

export interface UserInventoryItem {
  cardId: string
  quantity: number
  obtainedAt: Date[]
  card?: Card // populated on fetch
}

export interface Album {
  id: string
  name: string
  serie: string
  description: string
  coverImage: string
  requiredCards: string[] // card IDs
  season: string
  active: boolean
}

export interface UserProfile {
  id: string
  username: string
  displayName: string
  points: number
  role: 'admin' | 'user'
  createdAt: Date
  lastSeen: Date
}

export interface Transaction {
  id: string
  userId: string
  username: string
  type: 'redeem' | 'grant' | 'craft' | 'album_complete'
  pointsBefore: number
  pointsAfter: number
  pointsDelta: number
  cardsObtained?: string[]
  cardsConsumed?: string[]
  packType?: PackType
  note?: string
  createdAt: Date
}

export type PackType = 'basic' | 'premium' | 'legendary'

export interface Pack {
  id: PackType
  name: string
  cost: number
  cardCount: number
  description: string
  guaranteedRarity?: Rarity
  boostedRarity?: Rarity
}

export const PACKS: Pack[] = [
  {
    id: 'basic',
    name: 'Sobre Básico',
    cost: 100,
    cardCount: 1,
    description: '1 carta aleatoria del pool activo',
  },
  {
    id: 'premium',
    name: 'Sobre Premium',
    cost: 250,
    cardCount: 3,
    description: '3 cartas con probabilidad mejorada',
    boostedRarity: 'silver',
  },
  {
    id: 'legendary',
    name: 'Sobre Legendario',
    cost: 500,
    cardCount: 5,
    description: '5 cartas, garantiza al menos 1 Plata',
    guaranteedRarity: 'silver',
  },
]

export const RARITY_WEIGHTS: Record<PackType, Record<Rarity, number>> = {
  basic:     { bronze: 70, silver: 25, gold: 5 },
  premium:   { bronze: 50, silver: 40, gold: 10 },
  legendary: { bronze: 40, silver: 45, gold: 15 },
}

export const CRAFT_REQUIREMENTS: Record<Rarity, { from: Rarity; count: number } | null> = {
  bronze: null,
  silver: { from: 'bronze', count: 3 },
  gold:   { from: 'silver', count: 3 },
}
