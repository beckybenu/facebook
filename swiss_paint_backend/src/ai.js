// Intégration IA (API Claude). La clé reste côté serveur (jamais exposée au navigateur).
import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'

// Le client lit ANTHROPIC_API_KEY dans l'environnement.
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  return new Anthropic()
}

// Contexte entreprise fourni à l'IA pour des réponses/devis réalistes.
const COMPANY_CONTEXT = `Tu es l'assistant IA de SwissPaints Group Sàrl, une entreprise de peinture à Genève (Suisse).
Métiers : rénovation, peinture, décoration, gypserie, parquet, nettoyage.
Adresse : Rue de la Prulay 19B, 1217 Meyrin. TVA suisse : 8.1 %.
Tarifs indicatifs : main d'œuvre ~85 CHF/h ; mise en peinture ~18 CHF/m² ; petits travaux au forfait.
Réponds en français, de manière professionnelle, concise et utile. Tu aides le gérant et les ouvriers
à gérer les devis, les chantiers, les documents et l'administration.`

// Schéma structuré d'un devis généré par l'IA
const DEVIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    titre: { type: 'string' },
    sousTitre: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          titre: { type: 'string' },
          description: { type: 'string' },
          note: { type: 'string' },
          unit: { type: 'string', enum: ['heures', 'm2', 'unite', 'forfait'] },
          quantite: { type: 'number' },
          prixUnitaire: { type: 'number' },
          montant: { type: 'number' },
        },
        required: ['titre', 'description', 'unit', 'montant'],
      },
    },
  },
  required: ['titre', 'items'],
}

export function aiAvailable() {
  return !!process.env.ANTHROPIC_API_KEY
}

// Assistant conversationnel (admin / ouvrier)
export async function aiChat(messages) {
  const client = getClient()
  if (!client) throw new Error('IA non configurée (ANTHROPIC_API_KEY manquante).')
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: COMPANY_CONTEXT,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    messages: messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    })),
  })
  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
  return text
}

// Génération d'un devis à partir d'une description libre (sortie structurée)
export async function aiDevis(prompt) {
  const client = getClient()
  if (!client) throw new Error('IA non configurée (ANTHROPIC_API_KEY manquante).')
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      COMPANY_CONTEXT +
      `\n\nÀ partir de la demande du client, produis les lignes d'un devis estimatif.
Pour chaque ligne : un titre en MAJUSCULES, une description claire des travaux, une unité
(heures, m2, unite ou forfait), et le montant HT. Pour heures/m2/unite indique aussi quantite
et prixUnitaire ; pour un forfait, indique seulement le montant. Utilise des tarifs réalistes
(main d'œuvre ~85 CHF/h, peinture ~18 CHF/m²). Le champ "montant" est toujours le total HT de la ligne.`,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: DEVIS_SCHEMA },
    },
    messages: [{ role: 'user', content: String(prompt || '') }],
  })
  const text = res.content.find((b) => b.type === 'text')?.text || '{}'
  return JSON.parse(text)
}
