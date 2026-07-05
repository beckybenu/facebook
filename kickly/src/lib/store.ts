import { useMemo } from 'react'
import { buildFixtures } from '../data/fixtures'
import { predict } from '../data/predictions'
import type { Fixture, Prediction } from '../data/types'

export interface EnrichedFixture {
  fixture: Fixture
  prediction: Prediction
}

/**
 * Central "now". In a real app this comes from the server clock; here we anchor
 * to the actual current time so live/upcoming states behave naturally.
 */
export function useNow(): Date {
  return useMemo(() => new Date(), [])
}

export function useFixtures(now: Date): EnrichedFixture[] {
  return useMemo(() => {
    const from = new Date(now)
    from.setDate(from.getDate() - 1) // include yesterday for finished results
    return buildFixtures(from).map((fixture) => ({
      fixture,
      prediction: predict(fixture),
    }))
  }, [now])
}

export function useFixture(id: string, now: Date): EnrichedFixture | undefined {
  const all = useFixtures(now)
  return all.find((f) => f.fixture.id === id)
}
