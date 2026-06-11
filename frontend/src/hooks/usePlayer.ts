import { useState, useEffect, useCallback } from 'react'
import { fetchPlayer, PlayerInfo } from '../api/player'

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerInfo | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchPlayer()
      setPlayer(data)
    } catch (err) {
      console.error('Failed to load player', err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { player, reload: load }
}
