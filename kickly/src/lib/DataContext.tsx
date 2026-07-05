import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildFixtures } from '../data/fixtures'
import { loadLeagueLive, TSDB_LEAGUE_IDS } from '../data/api'
import { registerTeams } from '../data/teams'
import { predict } from '../data/predictions'
import { leagues } from '../data/leagues'
import type { Fixture, Prediction } from '../data/types'

export interface EnrichedFixture {
  fixture: Fixture
  prediction: Prediction
}

export type DataSource = 'live' | 'demo' | 'mixed'

interface DataState {
  now: Date
  fixtures: EnrichedFixture[]
  /** live = tout vient de l'API, mixed = certaines ligues seulement, demo = repli complet */
  source: DataSource
  loading: boolean
  /** Ligues effectivement alimentées par l'API */
  liveLeagues: string[]
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const now = useMemo(() => new Date(), [])

  const demoFixtures = useMemo(() => {
    const from = new Date(now)
    from.setDate(from.getDate() - 1)
    return buildFixtures(from)
  }, [now])

  const [state, setState] = useState<{
    fixtures: Fixture[]
    liveLeagues: string[]
    loading: boolean
  }>({ fixtures: demoFixtures, liveLeagues: [], loading: true })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const results = await Promise.allSettled(
        Object.keys(TSDB_LEAGUE_IDS).map(async (leagueId) => await loadLeagueLive(leagueId)),
      )
      if (cancelled) return

      const liveLeagues: string[] = []
      const liveFixtures: Fixture[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value && r.value.fixtures.length > 0) {
          registerTeams(r.value.teams)
          liveFixtures.push(...r.value.fixtures)
          liveLeagues.push(r.value.leagueId)
        }
      }

      if (liveLeagues.length === 0) {
        setState((s) => ({ ...s, loading: false }))
        return
      }

      // Ligues live : vraies données ; ligues sans réponse : démo conservée
      const liveSet = new Set(liveLeagues)
      const merged = [
        ...demoFixtures.filter((f) => !liveSet.has(f.leagueId)),
        ...liveFixtures,
      ].sort((a, b) => a.kickoff.localeCompare(b.kickoff))

      setState({ fixtures: merged, liveLeagues, loading: false })
    }

    load().catch(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: false }))
    })
    return () => {
      cancelled = true
    }
  }, [demoFixtures])

  const value = useMemo<DataState>(() => {
    const enriched = state.fixtures.map((fixture) => ({
      fixture,
      prediction: predict(fixture),
    }))
    const source: DataSource =
      state.liveLeagues.length === 0
        ? 'demo'
        : state.liveLeagues.length >= leagues.length
          ? 'live'
          : 'mixed'
    return {
      now,
      fixtures: enriched,
      source,
      loading: state.loading,
      liveLeagues: state.liveLeagues,
    }
  }, [state, now])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData doit être utilisé sous <DataProvider>')
  return ctx
}
