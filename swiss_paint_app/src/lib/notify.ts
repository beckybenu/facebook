// Création de notifications pour les employés.
import { notifDb, uid } from '../data/db'
import type { NotifType } from '../types'

export function notify(
  userId: string,
  type: NotifType,
  titre: string,
  opts: { message?: string; lien?: string } = {},
) {
  notifDb.create({
    id: uid('ntf'),
    userId,
    type,
    titre,
    message: opts.message,
    lien: opts.lien,
    lu: false,
    createdAt: new Date().toISOString(),
  })
}

export function notifyMany(
  userIds: string[],
  type: NotifType,
  titre: string,
  opts: { message?: string; lien?: string } = {},
) {
  // dédoublonne
  Array.from(new Set(userIds)).forEach((id) => notify(id, type, titre, opts))
}
