import { useData, type EnrichedFixture } from './DataContext'

export type { EnrichedFixture }

/** Horloge de référence partagée (fixée au chargement de l'app). */
export function useNow(): Date {
  return useData().now
}

export function useFixtures(_now?: Date): EnrichedFixture[] {
  return useData().fixtures
}

export function useFixture(id: string, _now?: Date): EnrichedFixture | undefined {
  return useData().fixtures.find((f) => f.fixture.id === id)
}
