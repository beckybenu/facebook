import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { usersDb } from '../../data/db'
import type { User } from '../../types'
import { ROLE_LABELS } from '../../lib/utils'

const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-red',
  ouvrier: 'badge-blue',
  client: 'badge-gray',
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    setUsers(usersDb.all())
  }, [])

  return (
    <Layout
      title="Liste des comptes"
      back
      right={
        <button className="icon-btn" onClick={() => navigate('/admin/users/new')} aria-label="Ajouter">
          ＋
        </button>
      }
    >
      {users.map((u) => {
        const initials = `${u.prenom[0] ?? ''}${u.nom[0] ?? ''}`.toUpperCase()
        return (
          <button key={u.id} className="list-row" onClick={() => navigate(`/admin/users/${u.id}`)}>
            {u.image ? (
              <img className="avatar" src={u.image} alt="" />
            ) : (
              <div className="avatar">{initials}</div>
            )}
            <div className="row-main">
              <div className="row-title">
                {u.prenom} {u.nom}
              </div>
              <div className="row-sub">{u.email}</div>
            </div>
            <span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span>
          </button>
        )
      })}

      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/admin/users/new')}>
        ＋ Ajouter un utilisateur
      </button>
    </Layout>
  )
}
