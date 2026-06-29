import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface HeaderProps {
  title: string
  back?: boolean
  right?: ReactNode
}

export default function Header({ title, back, right }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="app-header">
      {back ? (
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Retour">
          ‹
        </button>
      ) : (
        <span className="header-spacer" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="header-spacer" />}
    </header>
  )
}
