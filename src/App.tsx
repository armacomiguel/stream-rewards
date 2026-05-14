// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AlbumPage from './pages/AlbumPage'
import RedeemPage from './pages/RedeemPage'
import CraftPage from './pages/CraftPage'
import AdminPage from './pages/AdminPage'
import Layout from './components/shared/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!firebaseUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="font-body text-slate-400 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { firebaseUser } = useAuth()

  return (
    <div className="noise">
      <Routes>
        <Route path="/login" element={firebaseUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="album" element={<AlbumPage />} />
          <Route path="redeem" element={<RedeemPage />} />
          <Route path="craft" element={<CraftPage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}
