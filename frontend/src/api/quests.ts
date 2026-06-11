import client from './client'

export interface Quest {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'active' | 'scheduled' | 'cleared' | 'archived'
  rank: string
  tags: string[]
  deadline: string | null
  activate_at: string | null
  created_at: string
  updated_at: string
  cleared_at: string | null
  xp_earned: number | null
}

export interface QuestCreatePayload {
  title: string
  description?: string
  rank?: string
  tags?: string[]
  deadline?: string | null
  activate_at?: string | null
  status?: string
}

export interface QuestUpdatePayload {
  title?: string
  description?: string | null
  rank?: string
  tags?: string[]
  deadline?: string | null
  activate_at?: string | null
  status?: string
}

export async function fetchQuests(params?: {
  status?: string[]
}): Promise<Quest[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) {
    params.status.forEach((s) => searchParams.append('status', s))
  }
  const res = await client.get(`/quests?${searchParams.toString()}`)
  return res.data
}

export async function createQuest(data: QuestCreatePayload): Promise<Quest> {
  const res = await client.post('/quests', data)
  return res.data
}

export async function updateQuest(
  id: string,
  data: QuestUpdatePayload
): Promise<Quest> {
  const res = await client.patch(`/quests/${id}`, data)
  return res.data
}

export async function deleteQuest(id: string): Promise<void> {
  await client.delete(`/quests/${id}`)
}

export async function completeQuest(id: string): Promise<Quest> {
  const res = await client.post(`/quests/${id}/complete`)
  return res.data
}

export async function archiveQuest(id: string): Promise<Quest> {
  const res = await client.post(`/quests/${id}/archive`)
  return res.data
}

export async function tickQuests(): Promise<{ activated: string[]; count: number }> {
  const res = await client.post('/quests/tick')
  return res.data
}
