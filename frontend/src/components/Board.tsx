import { useState, useCallback } from 'react'
import { Quest } from '../api/quests'
import { RANK_ORDER } from '../lib/ranks'
import { calcXPGain } from '../lib/xp'
import Column from './Column'
import QuestModal from './QuestModal'
import XpPopup from './XpPopup'
import { useDragDrop, ColumnId } from '../hooks/useDragDrop'

interface BoardProps {
  quests: Quest[]
  onComplete: (id: string) => Promise<Quest>
  onArchive: (id: string) => Promise<Quest>
  onDelete: (id: string) => Promise<void>
  onCreate: (data: any) => Promise<Quest>
  onUpdate: (id: string, data: any) => Promise<Quest>
  onChangeStatus: (id: string, status: string) => Promise<Quest>
  onReload: () => void
}

interface XpPopupState {
  xp: number
  x: number
  y: number
}

export default function Board({
  quests,
  onComplete,
  onArchive,
  onDelete,
  onCreate,
  onUpdate,
  onChangeStatus,
  onReload,
}: BoardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [xpPopup, setXpPopup] = useState<XpPopupState | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function showToast(msg: string, type: string) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleDrop = useCallback(
    async (questId: string, targetColumn: ColumnId) => {
      const quest = quests.find((q) => q.id === questId)
      if (!quest) return

      const prevStatus = quest.status
      if (prevStatus === targetColumn) return

      try {
        if (targetColumn === 'cleared' && prevStatus !== 'cleared') {
          const xp = calcXPGain(quest.rank as any, quest.deadline, quest.created_at)
          const cardEl = document.querySelector(`[data-id="${questId}"]`)
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect()
            setXpPopup({ xp, x: rect.left + rect.width / 2 - 30, y: rect.top - 30 })
          }
          await onComplete(questId)
          showToast(`${xp >= 0 ? '+' : ''}${xp} XP — QUEST CLEARED!`, xp >= 0 ? 'success' : 'warning')
        } else if (targetColumn === 'active' && prevStatus === 'cleared') {
          await onChangeStatus(questId, 'active')
          showToast('QUEST REATIVADA', 'info')
        } else if (targetColumn === 'active') {
          await onChangeStatus(questId, 'active')
          showToast('QUEST ATIVADA', 'info')
        } else if (targetColumn === 'pending') {
          await onChangeStatus(questId, 'pending')
          showToast('QUEST MOVIDA PARA PENDING', 'info')
        } else {
          await onChangeStatus(questId, targetColumn)
          showToast('QUEST MOVIDA', 'info')
        }
        onReload()
      } catch (err) {
        console.error('Drop failed', err)
      }
    },
    [quests, onComplete, onChangeStatus, onReload]
  )

  const { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop: dndDrop } =
    useDragDrop({ onDrop: handleDrop })

  // Sort active column: rank desc, deadline asc, no deadline last
  const rankIndex = Object.fromEntries(RANK_ORDER.map((r, i) => [r, i]))
  const sortedActive = quests
    .filter((q) => q.status === 'active')
    .sort((a, b) => {
      const ri = (rankIndex[b.rank] || 0) - (rankIndex[a.rank] || 0)
      if (ri !== 0) return ri
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      if (b.deadline) return 1
      return 0
    })

  const pending = quests.filter((q) => q.status === 'pending' || q.status === 'scheduled')
  const cleared = quests.filter((q) => q.status === 'cleared')

  function handleEdit(id: string) {
    const q = quests.find((x) => x.id === id)
    if (q) {
      setEditingQuest(q)
      setModalOpen(true)
    }
  }

  function handleOpenCreate() {
    setEditingQuest(null)
    setModalOpen(true)
  }

  async function handleModalSave(data: any) {
    try {
      if (editingQuest) {
        await onUpdate(editingQuest.id, data)
        showToast('QUEST ATUALIZADA', 'success')
      } else {
        await onCreate(data)
        showToast('QUEST CRIADA', 'success')
      }
      setModalOpen(false)
      setEditingQuest(null)
      onReload()
    } catch (err) {
      console.error('Save failed', err)
    }
  }

  async function handleCompleteBtn(id: string) {
    const quest = quests.find((q) => q.id === id)
    if (!quest) return
    const xp = calcXPGain(quest.rank as any, quest.deadline, quest.created_at)
    const cardEl = document.querySelector(`[data-id="${id}"]`)
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect()
      setXpPopup({ xp, x: rect.left + rect.width / 2 - 30, y: rect.top - 30 })
    }
    await onComplete(id)
    showToast(`${xp >= 0 ? '+' : ''}${xp} XP — QUEST CLEARED!`, xp >= 0 ? 'success' : 'warning')
    onReload()
  }

  async function handleArchive(id: string) {
    await onArchive(id)
    showToast('QUEST ARQUIVADA', 'warning')
    onReload()
  }

  function handleDeleteConfirm(id: string) {
    setDeleteConfirm(id)
  }

  async function doDelete() {
    if (deleteConfirm) {
      await onDelete(deleteConfirm)
      setDeleteConfirm(null)
      showToast('QUEST REMOVIDA', 'danger')
      onReload()
    }
  }

  // Urgent badge count
  const urgentCount = quests.filter(
    (q) =>
      q.status === 'active' &&
      q.deadline &&
      new Date(q.deadline).getTime() - Date.now() < 86400000 &&
      new Date(q.deadline) > new Date()
  ).length
  const overdueCount = quests.filter(
    (q) => q.status === 'active' && q.deadline && new Date(q.deadline) < new Date()
  ).length
  const alertCount = urgentCount + overdueCount

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#dce6f8] px-3 sm:px-[18px] py-[11px] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3.5 flex-shrink-0">
        <div className="flex-shrink-0">
          <div className="font-mono text-[9px] text-[#7a9acf] tracking-[0.14em]">SYSTEM INTERFACE v2.4</div>
          <div className="text-sm sm:text-base font-bold text-[#1a3a7f] tracking-[0.1em] uppercase">Hunter Planner</div>
        </div>
        <div className="flex gap-1 order-3 sm:order-none sm:flex-1">
          <button className="font-mono text-[10px] px-2 sm:px-[11px] py-[3px] border border-[#5a80df] bg-[#eaf0ff] text-[#1a3a7f] rounded-sm tracking-[0.08em]">
            BOARD
          </button>
          <button className="font-mono text-[10px] px-2 sm:px-[11px] py-[3px] border border-[#c8d4ee] bg-transparent text-[#7a9acf] rounded-sm tracking-[0.08em] cursor-pointer">
            LIST
          </button>
          <button className="font-mono text-[10px] px-2 sm:px-[11px] py-[3px] border border-[#c8d4ee] bg-transparent text-[#7a9acf] rounded-sm tracking-[0.08em] cursor-pointer">
            LOG
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {alertCount > 0 && (
            <div className="font-mono text-[10px] text-[#bf3a20] border border-[#f0a090] bg-[#fff5f3] px-2 sm:px-2.5 py-[3px] rounded-sm flex items-center gap-[5px]">
              ⚠ {alertCount}
            </div>
          )}
          <button
            onClick={handleOpenCreate}
            className="font-rajdhani text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1 border border-[#5a80df] bg-[#eaf0ff] text-[#1a3a7f] rounded-sm tracking-[0.08em] hover:bg-[#d8e8ff] transition-colors whitespace-nowrap"
          >
            + NEW QUEST
          </button>
        </div>
      </div>

      {/* Board columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2.5 p-2 sm:p-3 overflow-y-auto">
        <Column
          id="pending"
          title="Pending"
          quests={pending}
          color="#8aaacf"
          onComplete={handleCompleteBtn}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDeleteConfirm}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={dndDrop}
        />
        <Column
          id="active"
          title="Active"
          quests={sortedActive}
          color="#4a70df"
          titleColor="#2a50bf"
          onComplete={handleCompleteBtn}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDeleteConfirm}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={dndDrop}
        />
        <Column
          id="cleared"
          title="Cleared"
          quests={cleared}
          color="#0a9a5a"
          titleColor="#0a7a4a"
          onComplete={handleCompleteBtn}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDeleteConfirm}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={dndDrop}
        />
      </div>

      {/* Quest Modal */}
      <QuestModal
        open={modalOpen}
        quest={editingQuest}
        onClose={() => {
          setModalOpen(false)
          setEditingQuest(null)
        }}
        onSave={handleModalSave}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="absolute inset-0 bg-[rgba(10,20,50,0.45)] flex items-center justify-center z-[200]"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="bg-white border border-[#c8d4ee] rounded w-[280px]">
            <div className="bg-[#ffecec] border-b border-[#f0a0a0] px-3.5 py-2.5 flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8a1a1a] tracking-[0.1em]">
                ⚠ CONFIRMAR EXCLUSÃO
              </span>
            </div>
            <div className="p-3.5 text-[13px] text-[#4a5a7f] leading-[1.5]">
              Tem certeza? Esta ação não pode ser desfeita.
            </div>
            <div className="px-3.5 py-2.5 border-t border-[#dce6f8] flex gap-1.5 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="font-rajdhani text-xs font-semibold px-3.5 py-[5px] border border-[#dce6f8] bg-white text-[#6a8aaf] rounded-sm hover:bg-[#f0f4ff] transition-colors"
              >
                CANCELAR
              </button>
              <button
                onClick={doDelete}
                className="font-rajdhani text-xs font-semibold px-3.5 py-[5px] border border-[#f0a0a0] bg-[#ffecec] text-[#8a1a1a] rounded-sm hover:bg-[#ffe0e0] transition-colors"
              >
                APAGAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XP Popup */}
      {xpPopup && (
        <XpPopup
          xp={xpPopup.xp}
          x={xpPopup.x}
          y={xpPopup.y}
          onDone={() => setXpPopup(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`absolute bottom-3.5 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.08em] px-4 py-1.5 rounded-sm whitespace-nowrap z-[300] transition-opacity ${
            toast.type === 'success'
              ? 'bg-[#e0f5ee] border border-[#8ad4b8] text-[#0a6a46]'
              : toast.type === 'warning'
              ? 'bg-[#fff8e8] border border-[#d4a040] text-[#7a4a00]'
              : toast.type === 'danger'
              ? 'bg-[#ffecec] border border-[#f0a0a0] text-[#8a1a1a]'
              : 'bg-[#eaf0ff] border border-[#aac0ef] text-[#1a3a7f]'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
