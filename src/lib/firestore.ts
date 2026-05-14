// src/lib/firestore.ts
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  addDoc, query, where, orderBy, limit, serverTimestamp,
  increment, Timestamp, runTransaction
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { db, secondaryAuth } from './firebase'
import { Card, UserProfile, Transaction, PackType, PACKS, RARITY_WEIGHTS, Rarity, UserInventoryItem } from '@/types'

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function adminCreateUser(
  username: string,
  password: string,
  displayName: string,
  initialPoints: number = 0
): Promise<string> {
  const email = `${username.toLowerCase()}@streamcards.local`

  // Usamos secondaryAuth para que Firebase NO haga login automático
  // con el nuevo usuario, preservando la sesión del admin.
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  const uid = cred.user.uid

  // Cerrar sesión en la instancia secundaria
  await signOut(secondaryAuth)

  // Crear el documento en Firestore con el UID obtenido
  await setDoc(doc(db, 'users', uid), {
    username: username.toLowerCase(),
    displayName,
    points: initialPoints,
    role: 'user',
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  })

  return uid
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as UserProfile
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile))
}

export async function grantPoints(uid: string, amount: number, note: string, adminName: string): Promise<void> {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) throw new Error('User not found')
  const before = userSnap.data().points

  await updateDoc(userRef, { points: increment(amount) })

  await addDoc(collection(db, 'transactions'), {
    userId: uid,
    username: userSnap.data().username,
    type: 'grant',
    pointsBefore: before,
    pointsAfter: before + amount,
    pointsDelta: amount,
    note: note || `Puntos otorgados por ${adminName}`,
    createdAt: serverTimestamp(),
  })
}

// ─── CARDS ───────────────────────────────────────────────────────────────────

export async function createCard(data: Omit<Card, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'cards'), {
    ...data,
    stockRemaining: data.stockTotal,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getAllCards(): Promise<Card[]> {
  const snap = await getDocs(query(collection(db, 'cards'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Card))
}

export async function getActiveCards(): Promise<Card[]> {
  // Solo un where para evitar índice compuesto. Filtramos stock en memoria.
  const snap = await getDocs(query(
    collection(db, 'cards'),
    where('active', '==', true)
  ))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Card))
    .filter(c => c.stockRemaining > 0)
}

// ─── REDEEM / PACK OPENING ───────────────────────────────────────────────────

function weightedRandom(weights: Record<Rarity, number>): Rarity {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [rarity, weight] of Object.entries(weights)) {
    r -= weight
    if (r <= 0) return rarity as Rarity
  }
  return 'bronze'
}

export async function redeemPack(
  uid: string,
  packType: PackType
): Promise<Card[]> {
  const pack = PACKS.find(p => p.id === packType)
  if (!pack) throw new Error('Pack not found')

  const activeCards = await getActiveCards()
  if (activeCards.length === 0) throw new Error('No hay cartas disponibles')

  const weights = RARITY_WEIGHTS[packType]
  const buckets: Record<Rarity, Card[]> = { bronze: [], silver: [], gold: [] }
  for (const c of activeCards) buckets[c.rarity].push(c)

  const obtainedCards: Card[] = []

  const pickCard = (rarity?: Rarity): Card | null => {
    const targetRarity = rarity || weightedRandom(weights)
    const fallbackOrder: Rarity[] =
      targetRarity === 'gold'   ? ['gold', 'silver', 'bronze'] :
      targetRarity === 'silver' ? ['silver', 'bronze'] :
                                  ['bronze']
    for (const r of fallbackOrder) {
      const pool = buckets[r].filter(c => !obtainedCards.find(o => o.id === c.id))
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)]
    }
    return null
  }

  if (pack.guaranteedRarity) {
    const card = pickCard(pack.guaranteedRarity)
    if (card) obtainedCards.push(card)
  }
  while (obtainedCards.length < pack.cardCount) {
    const card = pickCard()
    if (!card) break
    obtainedCards.push(card)
  }
  if (obtainedCards.length === 0) throw new Error('No se pudieron obtener cartas')

  const userRef = doc(db, 'users', uid)
  const cardRefs = obtainedCards.map(c => doc(db, 'cards', c.id))
  const invRefs  = obtainedCards.map(c => doc(db, 'users', uid, 'inventory', c.id))

  // Pre-generar el ID del log de transacción FUERA del runTransaction
  // para evitar el error de doc(collection()) dentro de la transacción
  const txLogRef = doc(collection(db, 'transactions'))

  await runTransaction(db, async (tx) => {
    // ── Reads primero ──────────────────────────────────────────────────────
    const userSnap  = await tx.get(userRef)
    if (!userSnap.exists()) throw new Error('User not found')

    const currentPoints: number = userSnap.data().points
    if (currentPoints < pack.cost) throw new Error('Puntos insuficientes')

    const cardSnaps = await Promise.all(cardRefs.map(r => tx.get(r)))
    const invSnaps  = await Promise.all(invRefs.map(r => tx.get(r)))

    for (let i = 0; i < cardSnaps.length; i++) {
      if (!cardSnaps[i].exists() || cardSnaps[i].data()!.stockRemaining <= 0)
        throw new Error(`La carta "${obtainedCards[i].name}" ya no tiene stock`)
    }

    // ── Writes después ─────────────────────────────────────────────────────
    tx.update(userRef, { points: increment(-pack.cost) })

    for (let i = 0; i < obtainedCards.length; i++) {
      tx.update(cardRefs[i], { stockRemaining: increment(-1) })

      if (invSnaps[i].exists()) {
        tx.update(invRefs[i], {
          quantity: increment(1),
          obtainedAt: [...(invSnaps[i].data()!.obtainedAt || []), Timestamp.now()]
        })
      } else {
        tx.set(invRefs[i], {
          cardId: obtainedCards[i].id,
          quantity: 1,
          obtainedAt: [Timestamp.now()]
        })
      }
    }

    // Usar el ref pre-generado con ID fijo — sin doc(collection()) adentro
    tx.set(txLogRef, {
      userId: uid,
      username: userSnap.data().username,
      type: 'redeem',
      pointsBefore: currentPoints,
      pointsAfter: currentPoints - pack.cost,
      pointsDelta: -pack.cost,
      packType,
      cardsObtained: obtainedCards.map(c => c.id),
      createdAt: serverTimestamp(),
    })
  })

  return obtainedCards
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────

export async function getUserInventory(uid: string): Promise<UserInventoryItem[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'inventory'))
  const items = snap.docs.map(d => ({ ...d.data() } as UserInventoryItem))

  const cardSnaps = await Promise.all(
    items.map(item => getDoc(doc(db, 'cards', item.cardId)))
  )
  return items.map((item, i) => ({
    ...item,
    card: cardSnaps[i].exists()
      ? ({ id: cardSnaps[i].id, ...cardSnaps[i].data() } as Card)
      : undefined,
  }))
}

// ─── CRAFT ───────────────────────────────────────────────────────────────────

export async function craftCard(
  uid: string,
  fromCardId: string,
  toCardId: string
): Promise<void> {
  const fromRef    = doc(db, 'users', uid, 'inventory', fromCardId)
  const toRef      = doc(db, 'users', uid, 'inventory', toCardId)
  const toCardRef  = doc(db, 'cards', toCardId)

  await runTransaction(db, async (tx) => {
    // Reads primero
    const fromSnap   = await tx.get(fromRef)
    const toSnap     = await tx.get(toRef)
    const toCardSnap = await tx.get(toCardRef)

    if (!fromSnap.exists() || fromSnap.data().quantity < 3)
      throw new Error('Necesitas 3 cartas para hacer craft')
    if (!toCardSnap.exists() || toCardSnap.data().stockRemaining <= 0)
      throw new Error('La carta objetivo no tiene stock disponible')

    // Writes después
    tx.update(fromRef, { quantity: increment(-3) })
    tx.update(toCardRef, { stockRemaining: increment(-1) })

    if (toSnap.exists()) {
      tx.update(toRef, {
        quantity: increment(1),
        obtainedAt: [...(toSnap.data().obtainedAt || []), Timestamp.now()]
      })
    } else {
      tx.set(toRef, {
        cardId: toCardId,
        quantity: 1,
        obtainedAt: [Timestamp.now()]
      })
    }

    const txRef = doc(collection(db, 'transactions'))
    tx.set(txRef, {
      userId: uid,
      type: 'craft',
      cardsConsumed: [fromCardId, fromCardId, fromCardId],
      cardsObtained: [toCardId],
      createdAt: serverTimestamp(),
    })
  })
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function getRecentTransactions(limitCount = 20): Promise<Transaction[]> {
  const snap = await getDocs(query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
}

export async function getUserTransactions(uid: string, limitCount = 10): Promise<Transaction[]> {
  const snap = await getDocs(query(
    collection(db, 'transactions'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
}
