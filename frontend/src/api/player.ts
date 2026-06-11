import client from './client'

export interface PlayerInfo {
  rank: string
  total_xp: number
  xp_to_next: number
  pct: number
}

export async function fetchPlayer(): Promise<PlayerInfo> {
  const res = await client.get('/player')
  return res.data
}
