import type { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'

interface LayoutProps {
  title: string
  back?: boolean
  right?: ReactNode
  children: ReactNode
  nav?: boolean // afficher la barre du bas
}

export default function Layout({ title, back, right, children, nav = true }: LayoutProps) {
  return (
    <div className="app-shell">
      <Header title={title} back={back} right={right} />
      <main className={`app-content ${nav ? '' : 'no-nav'}`}>{children}</main>
      {nav && <BottomNav />}
    </div>
  )
}
