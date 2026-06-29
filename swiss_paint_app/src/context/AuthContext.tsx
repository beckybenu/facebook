import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User, UserRole } from '../types'
import { usersDb, sessionDb, uid } from '../data/db'

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

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => { ok: boolean; error?: string }
  signup: (input: SignupInput) => { ok: boolean; error?: string }
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

  useEffect(() => {
    const sid = sessionDb.get()
    if (sid) {
      const u = usersDb.byId(sid)
      if (u) setUser(u)
    }
    setLoading(false)
  }, [])

  function login(email: string, password: string) {
    const u = usersDb.byEmail(email.trim())
    if (!u) return { ok: false, error: "Aucun compte avec cet email." }
    if (u.password !== password) return { ok: false, error: 'Mot de passe incorrect.' }
    sessionDb.set(u.id)
    setUser(u)
    return { ok: true }
  }

  function signup(input: SignupInput) {
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
    sessionDb.clear()
    setUser(null)
  }

  function refresh() {
    if (user) {
      const u = usersDb.byId(user.id)
      setUser(u ?? null)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      refresh,
      isAdmin: user?.role === 'admin',
      isOuvrier: user?.role === 'ouvrier',
      isClient: user?.role === 'client',
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
