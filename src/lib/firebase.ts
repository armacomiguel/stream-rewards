// src/lib/firebase.ts
// ⚠️  Reemplaza estos valores con los de tu proyecto en Firebase Console
// Firebase Console → Project Settings → Your Apps → Config

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// App principal — sesión del usuario activo
const app = initializeApp(firebaseConfig)

// App secundaria — SOLO para crear usuarios sin afectar la sesión activa
// Usar una instancia separada evita que createUserWithEmailAndPassword
// haga login automático con el usuario recién creado.
export const secondaryApp = initializeApp(firebaseConfig, 'secondary')
export const secondaryAuth = getAuth(secondaryApp)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
