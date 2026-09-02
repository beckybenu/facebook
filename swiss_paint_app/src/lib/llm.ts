// Connexion LLM côté navigateur (compatible OpenAI : Groq, OpenAI, etc.).
// Comme NeuralStark : la clé reste stockée localement dans le navigateur,
// et n'est envoyée qu'au fournisseur choisi. Fonctionne sans backend.
import { COMPANY } from './company'
import * as remote from '../data/remote'

const KEY = 'sp_llm'

export interface LlmConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

export const LLM_PRESETS: Record<string, { label: string; baseUrl: string; model: string; keysUrl: string }> = {
  groq: {
    label: 'Groq — gratuit, recommandé',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    keysUrl: 'https://console.groq.com/keys',
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    keysUrl: 'https://platform.openai.com/api-keys',
  },
  custom: { label: 'Autre (compatible OpenAI)', baseUrl: '', model: '', keysUrl: '' },
}

export function getLlm(): LlmConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as LlmConfig
    return c.apiKey && c.baseUrl && c.model ? c : null
  } catch {
    return null
  }
}
export function setLlm(cfg: LlmConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}
export function clearLlm() {
  localStorage.removeItem(KEY)
}
export function llmConfigured(): boolean {
  return !!getLlm()
}

const SYSTEM = `Tu es l'assistant IA de ${COMPANY.name}, une entreprise de peinture à Genève (Suisse).
Métiers : rénovation, peinture, décoration, gypserie, parquet, nettoyage.
Adresse : ${COMPANY.address}, ${COMPANY.zipCity}. TVA suisse : ${COMPANY.tvaRate} %.
Tarifs indicatifs : main d'œuvre ~85 CHF/h ; peinture ~18 CHF/m² ; petits travaux au forfait.
Réponds en français, de manière professionnelle, concise et utile.`

interface Msg {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Appel bas niveau compatible OpenAI (chat completions)
async function complete(messages: Msg[], jsonMode = false): Promise<string> {
  const cfg = getLlm()
  if (!cfg) throw new Error('IA non configurée')
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: 0.3,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }
  const r = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`Fournisseur IA : ${r.status} ${t.slice(0, 120)}`)
  }
  const j = await r.json()
  return j.choices?.[0]?.message?.content ?? ''
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ---------- API unifiée : LLM navigateur si configuré, sinon backend ----------

export function aiAvailable(cloud: boolean): boolean {
  return llmConfigured() || cloud
}

export async function aiAsk(
  messages: ChatMessage[],
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  if (llmConfigured()) {
    try {
      const reply = await complete([{ role: 'system', content: SYSTEM }, ...messages])
      return { ok: true, reply: reply.trim() }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }
  // Repli : assistant côté serveur (backend Anthropic)
  return remote.aiChat(messages)
}

const DEVIS_INSTRUCTION = `À partir de la demande, produis UNIQUEMENT un objet JSON (aucun texte autour) au format :
{"titre": string, "sousTitre"?: string, "items": [{"titre": string (MAJUSCULES), "description": string, "note"?: string, "unit": "heures"|"m2"|"unite"|"forfait", "quantite"?: number, "prixUnitaire"?: number, "montant": number}]}
Le champ "montant" est le total HT de la ligne (en CHF). Pour heures/m2/unite, renseigne aussi quantite et prixUnitaire ; pour un forfait, seulement montant. Tarifs réalistes (main d'œuvre ~85 CHF/h, peinture ~18 CHF/m²).`

export async function aiGenerateDevis(
  prompt: string,
): Promise<{ ok: boolean; devis?: unknown; error?: string }> {
  if (llmConfigured()) {
    try {
      const txt = await complete(
        [
          { role: 'system', content: SYSTEM + '\n' + DEVIS_INSTRUCTION },
          { role: 'user', content: prompt },
        ],
        true,
      )
      return { ok: true, devis: JSON.parse(txt) }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }
  return remote.aiDevis(prompt)
}

// Liste les modèles disponibles chez le fournisseur (endpoint compatible OpenAI)
export async function listModels(cfg: LlmConfig): Promise<string[]> {
  const r = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/models`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`${r.status} ${t.slice(0, 120)}`)
  }
  const j = await r.json()
  const ids: string[] = (j.data || []).map((m: { id: string }) => m.id)
  // Modèles de conversation en premier (on écarte whisper/tts/guard)
  return ids
    .filter((id) => !/whisper|tts|guard|embed/i.test(id))
    .sort()
}

// Test de connexion (petit ping)
export async function testLlm(cfg: LlmConfig): Promise<{ ok: boolean; error?: string }> {
  const prev = getLlm()
  setLlm(cfg)
  try {
    await complete([{ role: 'user', content: 'Réponds juste : OK' }])
    return { ok: true }
  } catch (e) {
    if (prev) setLlm(prev)
    else clearLlm()
    return { ok: false, error: (e as Error).message }
  }
}
