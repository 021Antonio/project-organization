import { RANK_XP_BASE, type Rank } from './ranks'

/**
 * Calculate XP gain for completing a quest.
 * Mirrors the backend formula exactly.
 */
export function calcXPGain(
  rank: Rank,
  deadline: string | null,
  createdAt: string
): number {
  const base = RANK_XP_BASE[rank] ?? 10

  if (!deadline) return base

  const now = Date.now()
  const dl = new Date(deadline).getTime()
  const created = new Date(createdAt).getTime()
  const totalDuration = dl - created

  if (totalDuration <= 0) return base

  const remaining = dl - now
  const ratio = remaining / totalDuration

  if (ratio < 0) {
    return -Math.round(base * 0.5)
  } else if (ratio >= 0 && ratio <= 0.1) {
    return Math.round(base * 0.2)
  } else if (ratio > 0.1 && ratio <= 0.5) {
    return Math.round(base * (0.2 + ratio * 1.6))
  } else {
    return base
  }
}
