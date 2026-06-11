import { useQuests } from '../hooks/useQuests'
import { usePlayer } from '../hooks/usePlayer'
import Board from '../components/Board'
import StatsBar from '../components/StatsBar'
import XpBar from '../components/XpBar'
import { getXpProgress } from '../lib/ranks'

export default function BoardPage() {
  const { quests, loading, reload, create, update, remove, complete, archive, changeStatus } = useQuests()
  const { player, reload: reloadPlayer } = usePlayer()

  const activeQuests = quests.filter((q) => q.status === 'active')
  const clearedQuests = quests.filter((q) => q.status === 'cleared')
  const overdueQuests = quests.filter(
    (q) => q.status === 'active' && q.deadline && new Date(q.deadline) < new Date()
  )
  const visibleQuests = quests.filter((q) => q.status !== 'archived')

  const totalXp = player?.total_xp ?? 0
  const xpProgress = getXpProgress(totalXp)

  async function handleComplete(id: string) {
    const result = await complete(id)
    reloadPlayer()
    return result
  }

  async function handleArchive(id: string) {
    const result = await archive(id)
    return result
  }

  async function handleChangeStatus(id: string, status: string) {
    const result = await changeStatus(id, status)
    return result
  }

  function handleReload() {
    reload()
    reloadPlayer()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8eef8] flex items-center justify-center">
        <div className="font-mono text-sm text-[#7a9acf] tracking-[0.1em]">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#e8eef8] flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col bg-[#f0f4ff] overflow-hidden relative font-rajdhani text-[#1a2540]">
        <StatsBar
          total={visibleQuests.length}
          active={activeQuests.length}
          cleared={clearedQuests.length}
          overdue={overdueQuests.length}
          xp={totalXp}
        />
        <XpBar
          rank={xpProgress.rank}
          pct={xpProgress.pct}
          current={xpProgress.current}
          next={xpProgress.next}
        />
        <Board
          quests={quests.filter((q) => q.status !== 'archived')}
          onComplete={handleComplete}
          onArchive={handleArchive}
          onDelete={remove}
          onCreate={create}
          onUpdate={update}
          onChangeStatus={handleChangeStatus}
          onReload={handleReload}
        />
      </div>
    </div>
  )
}
