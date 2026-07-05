import type { Fixture, Prediction, Team } from './types'
import { teamById } from './teams'

const HOME_ADVANTAGE = 1.15
const LEAGUE_AVG_GOALS = 1.35

function poisson(k: number, lambda: number): number {
  let fact = 1
  for (let i = 2; i <= k; i++) fact *= i
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact
}

function formBoost(form: Team['form']): number {
  // Recent form nudges expected goals ±. Most recent match weighted highest.
  let score = 0
  const weights = [0.05, 0.08, 0.12, 0.15, 0.2]
  form.forEach((r, i) => {
    const w = weights[i] ?? 0.1
    score += (r === 'W' ? 1 : r === 'D' ? 0 : -1) * w
  })
  return 1 + score * 0.25 // roughly ±15%
}

/**
 * Compute a full prediction for a fixture using a bivariate Poisson-style model.
 * Expected goals derive from each team's attack vs the opponent's defense,
 * home advantage, and recent form. The scoreline distribution is then summed
 * into 1/N/2 outcome probabilities, BTTS, over 2.5 and a most-likely score.
 */
export function predict(fixture: Fixture): Prediction {
  const home = teamById(fixture.homeId)!
  const away = teamById(fixture.awayId)!

  const xgHome =
    (home.attack / LEAGUE_AVG_GOALS) *
    (away.defense / LEAGUE_AVG_GOALS) *
    LEAGUE_AVG_GOALS *
    HOME_ADVANTAGE *
    formBoost(home.form)

  const xgAway =
    (away.attack / LEAGUE_AVG_GOALS) *
    (home.defense / LEAGUE_AVG_GOALS) *
    LEAGUE_AVG_GOALS *
    formBoost(away.form)

  const maxGoals = 8
  let homeWin = 0
  let draw = 0
  let awayWin = 0
  let btts = 0
  let over25 = 0
  let bestP = 0
  let scoreHome = 0
  let scoreAway = 0

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poisson(h, xgHome) * poisson(a, xgAway)
      if (h > a) homeWin += p
      else if (h === a) draw += p
      else awayWin += p
      if (h > 0 && a > 0) btts += p
      if (h + a > 2.5) over25 += p
      if (p > bestP) {
        bestP = p
        scoreHome = h
        scoreAway = a
      }
    }
  }

  const total = homeWin + draw + awayWin
  homeWin /= total
  draw /= total
  awayWin /= total

  const outcomes: Array<{ pick: Prediction['pick']; prob: number }> = [
    { pick: '1', prob: homeWin },
    { pick: 'N', prob: draw },
    { pick: '2', prob: awayWin },
  ]
  outcomes.sort((x, y) => y.prob - x.prob)
  const top = outcomes[0]
  const second = outcomes[1]

  // Confidence: gap between top pick and the field, scaled to 0-100
  const confidence = Math.round(
    Math.min(97, Math.max(38, top.prob * 100 + (top.prob - second.prob) * 60)),
  )

  return {
    fixtureId: fixture.id,
    homeWin,
    draw,
    awayWin,
    xgHome: Math.round(xgHome * 100) / 100,
    xgAway: Math.round(xgAway * 100) / 100,
    scoreHome,
    scoreAway,
    confidence,
    btts,
    over25,
    pick: top.pick,
    fairOdds: Math.round((1 / top.prob) * 100) / 100,
  }
}

export function pickTeamName(fixture: Fixture, pick: Prediction['pick']): string {
  if (pick === '1') return teamById(fixture.homeId)!.name
  if (pick === '2') return teamById(fixture.awayId)!.name
  return 'Match nul'
}

/** A short human-style AI narrative built from the numbers. */
export function analysis(fixture: Fixture, pred: Prediction): string[] {
  const home = teamById(fixture.homeId)!
  const away = teamById(fixture.awayId)!
  const lines: string[] = []

  const favourite = pred.pick === '1' ? home : pred.pick === '2' ? away : null
  if (favourite) {
    const prob = pred.pick === '1' ? pred.homeWin : pred.awayWin
    lines.push(
      `${favourite.name} part favori avec ${Math.round(prob * 100)}% de probabilité de victoire. ` +
        `Le modèle projette ${pred.scoreHome}-${pred.scoreAway} comme score le plus probable.`,
    )
  } else {
    lines.push(
      `Match très serré : le nul ressort comme l'issue la plus probable (${Math.round(
        pred.draw * 100,
      )}%). Peu d'écart de niveau entre les deux équipes.`,
    )
  }

  lines.push(
    `Attaque attendue : ${home.short} ${pred.xgHome} xG vs ${away.short} ${pred.xgAway} xG. ` +
      (pred.over25 > 0.55
        ? `Rencontre orientée vers un match ouvert (Over 2.5 à ${Math.round(pred.over25 * 100)}%).`
        : `Le modèle anticipe un match verrouillé (Under 2.5 favorisé).`),
  )

  const homeForm = home.form.filter((r) => r === 'W').length
  const awayForm = away.form.filter((r) => r === 'W').length
  lines.push(
    `Forme récente : ${home.short} ${homeForm}V sur 5, ${away.short} ${awayForm}V sur 5. ` +
      (pred.btts > 0.55
        ? `Les deux équipes devraient marquer (BTTS ${Math.round(pred.btts * 100)}%).`
        : `Une des deux défenses devrait tenir le clean sheet.`),
  )

  return lines
}
