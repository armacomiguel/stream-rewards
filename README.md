# StreamCards — Guía de Setup

## 1. Instalar dependencias
```bash
npm install
```

## 2. Configurar Firebase

### 2.1 Crear proyecto en Firebase
1. Ve a https://console.firebase.google.com
2. "Add project" → ponle el nombre que quieras
3. Desactiva Google Analytics (no lo necesitas)

### 2.2 Habilitar Authentication
1. Firebase Console → Authentication → Get started
2. Sign-in method → Email/Password → Enable → Save

### 2.3 Crear Firestore
1. Firebase Console → Firestore Database → Create database
2. Selecciona "Start in test mode" (lo securizamos después)
3. Elige la región más cercana (us-central1 está bien)

### 2.4 Obtener tu config
1. Firebase Console → Project Settings (ícono ⚙) → Your apps
2. Haz clic en "</>" (Web app) → Regístrala
3. Copia el objeto `firebaseConfig`

### 2.5 Pegar config en el proyecto
Abre `src/lib/firebase.ts` y reemplaza los valores:
```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

## 3. Crear tu cuenta de Admin

Como el sistema no tiene registro público, necesitas crear
tu cuenta de admin directamente en Firebase:

### 3.1 Crear el usuario en Authentication
1. Firebase Console → Authentication → Users → Add user
2. Email: `tuusername@streamcards.local`
3. Password: la que quieras
4. Copia el UID que aparece

### 3.2 Crear el documento en Firestore
1. Firebase Console → Firestore → Start collection → ID: `users`
2. Document ID: **pega el UID** del paso anterior
3. Agrega estos campos:
   - `username` (string): `tuusername`
   - `displayName` (string): `Tu Nombre`
   - `points` (number): `9999`
   - `role` (string): `admin`
   - `createdAt` (timestamp): fecha actual
   - `lastSeen` (timestamp): fecha actual

## 4. Aplicar reglas de seguridad
1. Firebase Console → Firestore → Rules
2. Reemplaza todo el contenido con lo que hay en `firestore.rules`
3. Publish

## 5. Correr el proyecto
```bash
npm run dev
```

Ve a http://localhost:5173
Entra con `tuusername` y tu contraseña.

---

## Flujo de uso diario

### Dar puntos a un viewer
1. Admin Panel → Usuarios
2. Busca al usuario → "+ Puntos"
3. Escribe la cantidad y una nota
4. Click "Otorgar"

### Agregar una carta nueva
1. Admin Panel → Cartas → Nueva carta
2. Llena nombre, personaje, rareza, stock
3. Para la imagen puedes usar URL de imgur, Discord CDN, etc.
4. Click "Crear carta"

### Crear cuenta para un viewer
1. Admin Panel → Usuarios → Crear nuevo usuario
2. Elige username y contraseña
3. Dale sus puntos iniciales si quieres
4. Díselo por Discord/chat y listo

---

## Stack utilizado
- React 18 + TypeScript + Vite
- Firebase (Auth + Firestore)
- Tailwind CSS
- Framer Motion
- React Router v6
- Lucide Icons
