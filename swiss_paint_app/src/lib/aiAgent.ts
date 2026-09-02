// Agent IA : l'assistant peut AGIR dans l'app via des "outils" (function calling).
// Les actions sont exécutées localement (db.ts) et filtrées selon le rôle.
import { chatRaw, aiGenerateDevis, type ToolDef, type RawMessage, type ChatMessage } from './llm'
import { tasksDb, devisDb, usersDb, timeDb, uid } from '../data/db'
import type { Devis, DevisItem, Task, User, UserRole } from '../types'
import { COMPANY, DEFAULT_INTRO, DEFAULT_REMARQUES } from './company'
import {
  lineAmount,
  devisTotals,
  hoursToHM,
  formatCHF,
  entryWorkedHours,
  startOfDay,
  startOfWeek,
  startOfMonth,
} from './utils'

export interface AgentCtx {
  role: UserRole
  userId: string
}
export interface AgentResult {
  reply: string
  navigate?: string
}

const noAccents = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// ---------- Définition des outils selon le rôle ----------
function toolset(role: UserRole): ToolDef[] {
  const tools: ToolDef[] = [
    {
      type: 'function',
      function: {
        name: 'naviguer',
        description: "Ouvrir un écran de l'application.",
        parameters: {
          type: 'object',
          properties: {
            page: {
              type: 'string',
              enum: ['accueil', 'devis', 'chantiers', 'pointage', 'documents', 'assistant', 'admin', 'profil'],
            },
          },
          required: ['page'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'lister_chantiers',
        description: 'Lister les chantiers.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'lister_devis',
        description: 'Lister les devis existants.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'creer_devis',
        description:
          "Créer un devis à partir d'une description en langage naturel des travaux. Renvoie le numéro du devis créé.",
        parameters: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Description des travaux à devis.' },
            lieuTravaux: { type: 'string' },
            contact: { type: 'string' },
          },
          required: ['description'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'changer_statut_devis',
        description: "Changer le statut d'un devis (brouillon, envoye, accepte, refuse).",
        parameters: {
          type: 'object',
          properties: {
            numero: { type: 'string', description: 'Numéro du devis, ex : DE-2026-06-01' },
            statut: { type: 'string', enum: ['brouillon', 'envoye', 'accepte', 'refuse'] },
          },
          required: ['numero', 'statut'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'resume_heures',
        description: "Résumer les heures travaillées d'un ouvrier sur une période.",
        parameters: {
          type: 'object',
          properties: {
            periode: { type: 'string', enum: ['jour', 'semaine', 'mois'] },
            ouvrier: { type: 'string', description: 'Nom ou prénom (admin uniquement, sinon soi-même)' },
          },
          required: ['periode'],
        },
      },
    },
  ]

  if (role === 'admin') {
    tools.push(
      {
        type: 'function',
        function: {
          name: 'creer_chantier',
          description: 'Créer un nouveau chantier.',
          parameters: {
            type: 'object',
            properties: {
              nom: { type: 'string' },
              description: { type: 'string' },
              adresse: { type: 'string' },
              priorite: { type: 'string', enum: ['basse', 'normale', 'haute'] },
              assigne_a: { type: 'string', description: "Nom/prénom de l'ouvrier à assigner" },
            },
            required: ['nom'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'modifier_chantier',
          description: "Modifier le statut ou l'assignation d'un chantier.",
          parameters: {
            type: 'object',
            properties: {
              chantier: { type: 'string', description: 'Nom du chantier' },
              statut: { type: 'string', enum: ['a_faire', 'en_cours', 'termine'] },
              assigne_a: { type: 'string' },
            },
            required: ['chantier'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'lister_ouvriers',
          description: 'Lister les ouvriers/employés.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'creer_ouvrier',
          description: 'Créer un compte ouvrier ou client.',
          parameters: {
            type: 'object',
            properties: {
              prenom: { type: 'string' },
              nom: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['ouvrier', 'client'] },
            },
            required: ['prenom', 'nom', 'email'],
          },
        },
      },
    )
  }
  return tools
}

const PAGES: Record<string, string> = {
  accueil: '/home',
  devis: '/devis',
  chantiers: '/chantiers',
  pointage: '/pointage',
  documents: '/documents',
  assistant: '/assistant',
  admin: '/admin',
  profil: '/profil',
}

// ---------- Exécution d'un outil ----------
async function execTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentCtx,
  effects: { navigate?: string },
): Promise<string> {
  const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

  switch (name) {
    case 'naviguer': {
      const page = s(args.page)
      const path = PAGES[page]
      if (!path) return `Page inconnue : ${page}`
      effects.navigate = path
      return `Écran "${page}" ouvert.`
    }

    case 'lister_chantiers': {
      const list = ctx.role === 'admin' ? tasksDb.all() : tasksDb.forUser(ctx.userId)
      if (!list.length) return 'Aucun chantier.'
      return list
        .map((t) => `- ${t.name} [${t.status}]${t.adresse ? ' — ' + t.adresse : ''}`)
        .join('\n')
    }

    case 'lister_devis': {
      const list = devisDb.all()
      if (!list.length) return 'Aucun devis.'
      return list
        .map((d) => `- ${d.numero} : ${d.titre} (${d.status}, ${formatCHF(devisTotals(d).totalTTC)} TTC)`)
        .join('\n')
    }

    case 'creer_devis': {
      const res = await aiGenerateDevis(s(args.description))
      if (!res.ok || !res.devis) return `Échec de génération : ${res.error || 'inconnu'}`
      const g = res.devis as { titre?: string; sousTitre?: string; items?: Array<Partial<DevisItem>> }
      const items: DevisItem[] = (g.items || []).map((it) => {
        const base: DevisItem = {
          id: uid('it'),
          titre: it.titre || '',
          description: it.description || '',
          note: it.note || '',
          unit: (it.unit as DevisItem['unit']) || 'forfait',
          quantite: it.quantite,
          prixUnitaire: it.prixUnitaire,
          montant: it.montant || 0,
        }
        base.montant = lineAmount(base)
        return base
      })
      if (!items.length) return "Impossible de créer les lignes du devis."
      const now = new Date()
      const devis: Devis = {
        id: uid('dev'),
        numero: devisDb.nextNumero(now.getFullYear(), now.getMonth() + 1),
        titre: g.titre || 'TRAVAUX',
        sousTitre: g.sousTitre || '',
        date: now.toISOString().slice(0, 10),
        validiteJours: 30,
        lieuTravaux: s(args.lieuTravaux) || 'À définir',
        contact: s(args.contact) || 'À définir',
        intro: DEFAULT_INTRO,
        items,
        tvaRate: COMPANY.tvaRate,
        remarques: [...DEFAULT_REMARQUES],
        status: 'brouillon',
        createdAt: now.toISOString(),
      }
      devisDb.create(devis)
      const { totalTTC } = devisTotals(devis)
      return `Devis ${devis.numero} créé (${items.length} lignes, ${formatCHF(totalTTC)} TTC). Visible dans l'écran Devis.`
    }

    case 'changer_statut_devis': {
      const numero = noAccents(s(args.numero))
      const d = devisDb.all().find((x) => noAccents(x.numero) === numero)
      if (!d) return `Devis "${s(args.numero)}" introuvable.`
      const st = s(args.statut) as Devis['status']
      devisDb.update({ ...d, status: st })
      return `Statut du devis ${d.numero} changé en "${st}".`
    }

    case 'resume_heures': {
      let target: User | undefined
      if (ctx.role === 'admin' && args.ouvrier) {
        const q = noAccents(s(args.ouvrier))
        target = usersDb
          .all()
          .find((u) => noAccents(`${u.prenom} ${u.nom} ${u.username}`).includes(q))
      } else {
        target = usersDb.byId(ctx.userId)
      }
      if (!target) return `Ouvrier "${s(args.ouvrier)}" introuvable.`
      const periode = s(args.periode) || 'semaine'
      const now = new Date()
      const from = periode === 'jour' ? startOfDay(now) : periode === 'mois' ? startOfMonth(now) : startOfWeek(now)
      const worked = timeDb
        .all()
        .filter((e) => e.userId === target!.id && new Date(e.clockIn).getTime() >= from)
        .reduce((sum, e) => sum + entryWorkedHours(e), 0)
      return `${target.prenom} ${target.nom} — ${periode} : ${hoursToHM(worked)} travaillées.`
    }

    // ----- Admin -----
    case 'creer_chantier': {
      let assignedUserId: string | undefined
      if (args.assigne_a) {
        const q = noAccents(s(args.assigne_a))
        assignedUserId = usersDb
          .all()
          .find((u) => noAccents(`${u.prenom} ${u.nom} ${u.username}`).includes(q))?.id
      }
      const t: Task = {
        id: uid('tsk'),
        name: s(args.nom),
        description: s(args.description),
        status: 'a_faire',
        priority: (s(args.priorite) as Task['priority']) || 'normale',
        assignedUserId,
        adresse: s(args.adresse),
        createdAt: new Date().toISOString(),
      }
      tasksDb.create(t)
      return `Chantier "${t.name}" créé${assignedUserId ? ' et assigné' : ''}.`
    }

    case 'modifier_chantier': {
      const q = noAccents(s(args.chantier))
      const t = tasksDb.all().find((x) => noAccents(x.name).includes(q))
      if (!t) return `Chantier "${s(args.chantier)}" introuvable.`
      const patch: Partial<Task> = {}
      if (args.statut) patch.status = s(args.statut) as Task['status']
      if (args.assigne_a) {
        const qq = noAccents(s(args.assigne_a))
        patch.assignedUserId = usersDb
          .all()
          .find((u) => noAccents(`${u.prenom} ${u.nom} ${u.username}`).includes(qq))?.id
      }
      tasksDb.update({ ...t, ...patch })
      return `Chantier "${t.name}" mis à jour.`
    }

    case 'lister_ouvriers': {
      const list = usersDb.all().filter((u) => u.role !== 'client')
      return list.map((u) => `- ${u.prenom} ${u.nom} (${u.role}, ${u.email})`).join('\n') || 'Aucun.'
    }

    case 'creer_ouvrier': {
      const email = s(args.email).trim()
      if (usersDb.byEmail(email)) return `Un compte existe déjà avec ${email}.`
      const role = s(args.role) === 'client' ? 'client' : 'ouvrier'
      const tempPwd = 'swisspaints'
      const u: User = {
        id: uid('usr'),
        email,
        password: tempPwd,
        username: (s(args.prenom)[0] + s(args.nom)).toLowerCase().replace(/\s/g, ''),
        nom: s(args.nom),
        prenom: s(args.prenom),
        role: role as UserRole,
        createdAt: new Date().toISOString(),
      }
      usersDb.create(u)
      return `Compte ${role} créé pour ${u.prenom} ${u.nom} (${email}). Mot de passe provisoire : "${tempPwd}" (à changer).`
    }

    default:
      return `Outil inconnu : ${name}`
  }
}

const AGENT_SYSTEM = `Tu es l'assistant-agent de ${COMPANY.name} (peinture, Genève). Tu peux AGIR dans l'application via les outils fournis : créer des devis, gérer les chantiers, résumer les heures, ouvrir des écrans, etc.
Règles :
- Utilise un outil dès que la demande implique une action (créer, lister, modifier, ouvrir, résumer). N'invente jamais de résultat : appelle l'outil.
- Si une information indispensable manque, demande-la brièvement avant d'agir.
- Après une action, confirme en une phrase claire ce qui a été fait (numéro de devis, nom du chantier…).
- Réponds toujours en français, de façon concise et professionnelle. Montants en CHF, TVA ${COMPANY.tvaRate} %.`

// ---------- Boucle agent ----------
export async function runAgent(history: ChatMessage[], ctx: AgentCtx): Promise<AgentResult> {
  const tools = toolset(ctx.role)
  const messages: RawMessage[] = [
    { role: 'system', content: AGENT_SYSTEM },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]
  const effects: { navigate?: string } = {}

  for (let step = 0; step < 5; step++) {
    let res
    try {
      res = await chatRaw(messages, tools)
    } catch (e) {
      return { reply: `⚠️ ${(e as Error).message}` }
    }
    if (!res.toolCalls.length) {
      return { reply: res.content || '(pas de réponse)', navigate: effects.navigate }
    }
    // Rejoue le tour assistant (avec ses appels d'outils) puis les résultats
    messages.push({ role: 'assistant', content: res.content || '', tool_calls: res.toolCalls })
    for (const tc of res.toolCalls) {
      let out: string
      try {
        const parsed = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}
        out = await execTool(tc.function.name, parsed, ctx, effects)
      } catch (e) {
        out = `Erreur : ${(e as Error).message}`
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: out })
    }
  }
  // Sécurité : trop d'étapes → demande une réponse finale sans outils
  try {
    const final = await chatRaw(messages)
    return { reply: final.content || 'Terminé.', navigate: effects.navigate }
  } catch {
    return { reply: 'Action effectuée.', navigate: effects.navigate }
  }
}
