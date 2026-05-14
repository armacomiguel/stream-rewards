// src/components/shared/Layout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/AuthContext'
import {
  LayoutDashboard, BookOpen, Gift, Zap,
  Shield, LogOut, Tv2
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/album',     icon: BookOpen,        label: 'Álbum'     },
  { to: '/redeem',    icon: Gift,            label: 'Canjear'   },
  { to: '/craft',     icon: Zap,             label: 'Craft'     },
]

export default function Layout() {
  const { userProfile, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-surface/50 backdrop-blur-sm fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30">
              <Tv2 size={18} className="text-accent-light" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-white leading-none">StreamCards</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Colecciona tu legado</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-accent/5 border border-accent/10">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Jugador</p>
          <p className="font-display font-semibold text-white mt-0.5">{userProfile?.displayName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="font-mono text-gold text-sm font-medium">{userProfile?.points?.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-6 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-accent/15 text-accent-light border border-accent/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-accent-light' : 'text-slate-500 group-hover:text-slate-300'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group mt-4',
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/5'
              )}
            >
              {({ isActive }) => (
                <>
                  <Shield size={17} className={isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400'} />
                  Admin Panel
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 group"
          >
            <LogOut size={17} className="group-hover:text-red-400" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
