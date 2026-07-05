import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  Home,
  Layers,
  Menu,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import { Logo } from './Logo'
import { useData } from '../lib/DataContext'

const nav = [
  { to: '/', label: 'Matchs du jour', icon: Home, end: true },
  { to: '/predictions', label: 'Pronostics IA', icon: Sparkles },
  { to: '/parlays', label: 'Combinés', icon: Layers },
  { to: '/leagues', label: 'Ligues', icon: CalendarDays },
  { to: '/worldcup', label: 'Coupe du Monde 2026', icon: Trophy },
]

function DataBadge() {
  const { source, loading } = useData()
  if (loading) {
    return (
      <span className="chip hidden bg-pitch-800 text-slate-300 sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber-400" />
        Chargement des données...
      </span>
    )
  }
  if (source === 'demo') {
    return (
      <span
        className="chip hidden bg-amber-400/10 text-amber-400 sm:flex"
        title="API football injoignable — pronostics calculés sur des données de démonstration"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Mode démo
      </span>
    )
  }
  return (
    <span
      className="chip hidden bg-pitch-800 text-slate-300 sm:flex"
      title={
        source === 'live'
          ? 'Calendriers et résultats réels via TheSportsDB'
          : 'Données réelles pour les ligues en saison, démo pour les autres'
      }
    >
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-lime" />
      Données live
    </span>
  )
}

export function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transform border-r border-white/5 bg-pitch-900/95 backdrop-blur-lg transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-2 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-lime/10 text-lime'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mt-6 rounded-2xl border border-lime/20 bg-gradient-to-br from-lime/10 to-transparent p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-lime">
            <Sparkles size={16} /> Kickly Pro
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Débloquez tous les combinés IA, les value bets et les analyses illimitées.
          </p>
          <button className="btn-primary mt-3 w-full text-xs">Passer Pro</button>
        </div>

        <div className="absolute bottom-4 left-0 w-full px-5 text-[11px] text-slate-600">
          Modèle IA · 210+ sources de données · Jouez responsable (18+)
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-pitch-950/80 px-4 backdrop-blur-lg lg:px-8">
          <button
            className="text-slate-300 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              className="w-full rounded-xl border border-white/5 bg-pitch-900 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-lime/40"
              placeholder="Rechercher une équipe, une ligue..."
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <DataBadge />
            <button className="btn-ghost hidden py-2 text-xs sm:inline-flex">Connexion</button>
            <button className="btn-primary py-2 text-xs">Commencer</button>
          </div>
        </header>

        <main key={location.pathname} className="flex-1 animate-fade-up px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-slate-600 lg:px-8">
          Kickly · L'IA au service de vos pronostics football. Les pronostics sont fournis à
          titre informatif et ne garantissent aucun résultat. Les paris comportent des risques :
          jouez responsable — 18+.
        </footer>
      </div>
    </div>
  )
}
