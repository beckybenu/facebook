import type { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

interface LayoutProps {
  title: string
  back?: boolean
  right?: ReactNode
  children: ReactNode
  nav?: boolean // afficher la barre du bas
  wide?: boolean // contenu pleine largeur sur bureau (tableaux, plannings…)
}

export default function Layout({ title, back, right, children, nav = true, wide = false }: LayoutProps) {
  return (
    <div className={`app-layout ${nav ? '' : 'no-sidebar'}`}>
      {nav && <Sidebar />}
      <div className="app-shell">
        <Header title={title} back={back} right={right} />
        <main className={`app-content ${nav ? '' : 'no-nav'} ${wide ? 'wide' : ''}`}>{children}</main>
        {nav && <BottomNav />}
      </div>
    </div>
  )
}
