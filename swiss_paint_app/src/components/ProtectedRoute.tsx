import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'
import { caps, type Caps } from '../lib/roles'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: UserRole[] // restreint à ces rôles (cas particuliers)
  cap?: keyof Caps // restreint via la matrice de capacités (source de vérité)
}

export default function ProtectedRoute({ children, roles, cap }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Chargement…</div>
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />
  if (cap && !caps(user.role)[cap]) return <Navigate to="/home" replace />

  return <>{children}</>
}
