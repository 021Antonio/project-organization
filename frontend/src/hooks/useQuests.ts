import { useState, useEffect, useCallback } from 'react'
import {
  Quest,
  fetchQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  completeQuest,
  archiveQuest,
  tickQuests,
  QuestCreatePayload,
  QuestUpdatePayload,
} from '../api/quests'

export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchQuests({
        status: ['pending', 'active', 'scheduled', 'cleared'],
      })
      setQuests(data)
    } catch (err) {
      console.error('Failed to load quests', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Tick scheduled quests every 30s and always reload to reflect changes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await tickQuests()
        await load()
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [load])

  const create = async (data: QuestCreatePayload) => {
    const quest = await createQuest(data)
    setQuests((prev) => [...prev, quest])
    return quest
  }

  const update = async (id: string, data: QuestUpdatePayload) => {
    const quest = await updateQuest(id, data)
    setQuests((prev) => prev.map((q) => (q.id === id ? quest : q)))
    return quest
  }

  const remove = async (id: string) => {
    await deleteQuest(id)
    setQuests((prev) => prev.filter((q) => q.id !== id))
  }

  const complete = async (id: string) => {
    const quest = await completeQuest(id)
    setQuests((prev) => prev.map((q) => (q.id === id ? quest : q)))
    return quest
  }

  const archive = async (id: string) => {
    const quest = await archiveQuest(id)
    setQuests((prev) => prev.map((q) => (q.id === id ? quest : q)))
    return quest
  }

  const changeStatus = async (id: string, newStatus: string) => {
    const quest = await updateQuest(id, { status: newStatus })
    setQuests((prev) => prev.map((q) => (q.id === id ? quest : q)))
    return quest
  }

  return {
    quests,
    loading,
    reload: load,
    create,
    update,
    remove,
    complete,
    archive,
    changeStatus,
  }
}
