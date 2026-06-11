export const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'S+'] as const
export type Rank = (typeof RANK_ORDER)[number]

export const RANK_XP_BASE: Record<Rank, number> = {
  E: 10,
  D: 20,
  C: 40,
  B: 80,
  A: 160,
  S: 320,
  'S+': 500,
}

export const RANK_THRESHOLDS: [Rank, number][] = [
  ['E', 0],
  ['D', 50],
  ['C', 150],
  ['B', 350],
  ['A', 750],
  ['S', 1500],
  ['S+', 3000],
]

export interface RankStyle {
  bg: string
  color: string
  border: string
}

export const RANK_STYLES: Record<Rank, RankStyle> = {
  'S+': { bg: '#f0e0ff', color: '#5a0a9f', border: '#c080f0' },
  S: { bg: '#ffecec', color: '#8a1a1a', border: '#f0a0a0' },
  A: { bg: '#e0eaff', color: '#1a4aaf', border: '#aac0ef' },
  B: { bg: '#fff3dc', color: '#7a4a00', border: '#e0b860' },
  C: { bg: '#fff3dc', color: '#9a6a00', border: '#d4a840' },
  D: { bg: '#e8f5dc', color: '#2a5a0a', border: '#90c860' },
  E: { bg: '#f0f0f0', color: '#4a4a5a', border: '#c0c0d0' },
}

export function getPlayerRank(totalXp: number): Rank {
  let rank: Rank = 'E'
  for (const [r, threshold] of RANK_THRESHOLDS) {
    if (totalXp >= threshold) rank = r
  }
  return rank
}

export function getXpProgress(totalXp: number) {
  const rank = getPlayerRank(totalXp)
  const idx = RANK_THRESHOLDS.findIndex(([r]) => r === rank)
  if (idx >= RANK_THRESHOLDS.length - 1) {
    return { rank, pct: 100, current: totalXp, next: totalXp }
  }
  const currentThreshold = RANK_THRESHOLDS[idx][1]
  const nextThreshold = RANK_THRESHOLDS[idx + 1][1]
  const inRank = totalXp - currentThreshold
  const needed = nextThreshold - currentThreshold
  return {
    rank,
    pct: Math.round((inRank / needed) * 100),
    current: inRank,
    next: needed,
  }
}
