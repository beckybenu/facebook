import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User, UserRole } from '../types'
import { usersDb, sessionDb, uid } from '../data/db'
import * as remote from '../data/remote'

interface SignupInput {
  email: string
  password: string
  username: string
  nom: string
  prenom: string
  role: UserRole
  titre?: string
  telephone?: string
}

type Result = { ok: boolean; error?: string }

interface AuthContextValue {
  user: User | null
  loading: boolean
  cloud: boolean
  login: (email: string, password: string) => Promise<Result>
  signup: (input: SignupInput) => Promise<Result>
  logout: () => void
  refresh: () => void
  isAdmin: boolean
  isOuvrier: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const cloud = remote.isCloud()

  // Restauration de session au démarrage
  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (remote.isCloud()) {
        const u = await remote.me() // valide le token serveur
        if (u) {
          await remote.hydrate()
          if (!cancelled) setUser(u)
        }
      } else {
        const sid = sessionDb.get()
        if (sid) {
          const u = usersDb.byId(sid)
          if (u) setUser(u)
        }
      }
      if (!cancelled) setLoading(false)
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  // Polling "temps réel" en mode cloud : rafraîchit le cache toutes les 5 s
  useEffect(() => {
    if (!cloud || !user) return
    const i = setInterval(() => {
      remote.hydrate()
    }, 5000)
    return () => clearInterval(i)
  }, [cloud, user])

  async function login(email: string, password: string): Promise<Result> {
    if (remote.isCloud()) {
      const res = await remote.login(email, password)
      if (res.ok && res.user) setUser(res.user)
      return { ok: res.ok, error: res.error }
    }
    // Mode local
    const u = usersDb.byEmail(email.trim())
    if (!u) return { ok: false, error: "Aucun compte avec cet email." }
    if (u.password !== password) return { ok: false, error: 'Mot de passe incorrect.' }
    sessionDb.set(u.id)
    setUser(u)
    return { ok: true }
  }

  async function signup(input: SignupInput): Promise<Result> {
    if (remote.isCloud()) {
      const res = await remote.signup(input as unknown as Record<string, unknown>)
      if (res.ok && res.user) setUser(res.user)
      return { ok: res.ok, error: res.error }
    }
    // Mode local
    if (usersDb.byEmail(input.email.trim())) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' }
    }
    const newUser: User = {
      id: uid('usr'),
      email: input.email.trim(),
      password: input.password,
      username: input.username.trim(),
      nom: input.nom.trim(),
      prenom: input.prenom.trim(),
      role: input.role,
      titre: input.titre,
      telephone: input.telephone,
      createdAt: new Date().toISOString(),
    }
    usersDb.create(newUser)
    sessionDb.set(newUser.id)
    setUser(newUser)
    return { ok: true }
  }

  function logout() {
    if (remote.isCloud()) remote.logout()
    else sessionDb.clear()
    setUser(null)
  }

  function refresh() {
    if (remote.isCloud()) {
      remote.hydrate().then(() => remote.me().then((u) => u && setUser(u)))
    } else if (user) {
      setUser(usersDb.byId(user.id) ?? null)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      cloud,
      login,
      signup,
      logout,
      refresh,
      isAdmin: user?.role === 'admin',
      isOuvrier: user?.role === 'ouvrier',
      isClient: user?.role === 'client',
    }),
    [user, loading, cloud],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
