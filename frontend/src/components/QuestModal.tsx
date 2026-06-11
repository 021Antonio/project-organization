import { useState, useEffect } from 'react'
import { Quest, QuestCreatePayload, QuestUpdatePayload } from '../api/quests'

interface QuestModalProps {
  open: boolean
  quest: Quest | null
  onClose: () => void
  onSave: (data: QuestCreatePayload | QuestUpdatePayload) => void
}

export default function QuestModal({ open, quest, onClose, onSave }: QuestModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rank, setRank] = useState('B')
  const [tags, setTags] = useState('')
  const [deadline, setDeadline] = useState('')
  const [activationMode, setActivationMode] = useState<'now' | 'sched'>('now')
  const [activateAt, setActivateAt] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (quest) {
      setTitle(quest.title)
      setDescription(quest.description || '')
      setRank(quest.rank)
      setTags(quest.tags?.join(', ') || '')
      setDeadline(quest.deadline ? new Date(quest.deadline).toISOString().slice(0, 16) : '')
      setActivateAt(quest.activate_at ? new Date(quest.activate_at).toISOString().slice(0, 16) : '')
      setActivationMode(quest.activate_at ? 'sched' : 'now')
    } else {
      setTitle('')
      setDescription('')
      setRank('B')
      setTags('')
      setDeadline('')
      setActivateAt('')
      setActivationMode('now')
    }
  }, [quest, open])

  if (!open) return null

  function handleSave() {
    if (!title.trim()) return

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const data: QuestCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      rank,
      tags: tagList,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      activate_at: activationMode === 'sched' && activateAt ? new Date(activateAt).toISOString() : null,
    }

    // Validate: activate_at must be at least 24h before deadline
    if (data.activate_at && data.deadline) {
      const dlTime = new Date(data.deadline).getTime()
      const actTime = new Date(data.activate_at).getTime()
      if (dlTime - actTime < 86400000) {
        setError('Agendamento deve ser pelo menos 24h antes do deadline')
        return
      }
    }

    if (!quest && activationMode === 'sched' && activateAt) {
      data.status = 'scheduled'
    } else if (!quest) {
      data.status = 'active'
    }

    setError('')
    onSave(data)
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(10,20,50,0.45)] flex items-start justify-center z-[100] pt-0 sm:pt-5 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-[#c8d4ee] rounded w-full sm:w-[360px] min-h-screen sm:min-h-0 sm:my-4 overflow-hidden">
        {/* Modal header */}
        <div className="bg-[#f0f4ff] border-b border-[#dce6f8] px-3.5 py-[11px] flex items-center justify-between">
          <div>
            <div className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em]">
              {quest ? 'QUEST EDITOR' : 'NEW QUEST'}
            </div>
            <div className="text-sm font-bold text-[#1a3a7f] tracking-[0.08em]">
              {quest ? 'EDIT QUEST' : 'CREATE QUEST'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 border border-[#dce6f8] bg-white rounded-sm flex items-center justify-center text-[#8aaacf] text-sm hover:border-[#f0a0a0] hover:text-[#8a1a1a] hover:bg-[#ffecec] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="p-3.5 max-h-[70vh] sm:max-h-[400px] overflow-y-auto">
          {/* Title */}
          <div className="mb-[11px]">
            <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-1">
              QUEST TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da quest..."
              className="w-full font-rajdhani text-[13px] font-medium border border-[#dce6f8] rounded-sm px-2.5 py-1.5 bg-[#f8faff] text-[#1a2540] outline-none focus:border-[#5a80df] focus:bg-white transition-colors"
            />
          </div>

          {/* Description */}
          <div className="mb-[11px]">
            <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-1">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes..."
              className="w-full font-rajdhani text-[13px] font-medium border border-[#dce6f8] rounded-sm px-2.5 py-1.5 bg-[#f8faff] text-[#1a2540] outline-none h-14 resize-none leading-[1.4] focus:border-[#5a80df] focus:bg-white transition-colors"
            />
          </div>

          {/* Rank + Tags row */}
          <div className="grid grid-cols-2 gap-2 mb-[11px]">
            <div>
              <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-1">
                RANK
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full font-rajdhani text-[13px] font-medium border border-[#dce6f8] rounded-sm px-2.5 py-1.5 bg-[#f8faff] text-[#1a2540] outline-none focus:border-[#5a80df] focus:bg-white transition-colors"
              >
                <option value="S+">S+ — Lendário</option>
                <option value="S">S — Crítico</option>
                <option value="A">A — Alto</option>
                <option value="B">B — Médio</option>
                <option value="C">C — Normal</option>
                <option value="D">D — Baixo</option>
                <option value="E">E — Mínimo</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-1">
                TAGS (vírgula)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ex: fiap, backend"
                className="w-full font-rajdhani text-[13px] font-medium border border-[#dce6f8] rounded-sm px-2.5 py-1.5 bg-[#f8faff] text-[#1a2540] outline-none focus:border-[#5a80df] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-[11px]">
            <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-1">
              DEADLINE
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full font-rajdhani text-[13px] font-medium border border-[#dce6f8] rounded-sm px-2.5 py-1.5 bg-[#f8faff] text-[#1a2540] outline-none focus:border-[#5a80df] focus:bg-white transition-colors"
            />
          </div>

          {/* Activation toggle */}
          <div className="flex items-center gap-2.5 mb-[11px]">
            <span className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em]">ATIVAR</span>
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => setActivationMode('now')}
                className={`font-mono text-[10px] px-2.5 py-1 border rounded-sm transition-all ${
                  activationMode === 'now'
                    ? 'bg-[#eaf0ff] border-[#5a80df] text-[#1a3a7f]'
                    : 'bg-[#f8faff] border-[#dce6f8] text-[#7a9acf]'
                }`}
              >
                AGORA
              </button>
              <button
                onClick={() => setActivationMode('sched')}
                className={`font-mono text-[10px] px-2.5 py-1 border rounded-sm transition-all ${
                  activationMode === 'sched'
                    ? 'bg-[#eaf0ff] border-[#5a80df] text-[#1a3a7f]'
                    : 'bg-[#f8faff] border-[#dce6f8] text-[#7a9acf]'
                }`}
              >
                AGENDAR
              </button>
            </div>
          </div>

          {/* Schedule fields */}
          {activationMode === 'sched' && (
            <div className="mb-[11px]">
              <label className="font-mono text-[9px] text-[#7a9acf] tracking-[0.12em] block mb-1">
                DATA/HORA DE ATIVAÇÃO
              </label>
              <input
                type="datetime-local"
                value={activateAt}
                onChange={(e) => setActivateAt(e.target.value)}
                className="w-full font-rajdhani text-[13px] font-medium border border-[#dce6f8] rounded-sm px-2.5 py-1.5 bg-[#f8faff] text-[#1a2540] outline-none focus:border-[#5a80df] focus:bg-white transition-colors"
              />
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-3.5 py-2.5 border-t border-[#dce6f8] flex flex-col gap-2 bg-[#f8faff]">
          {error && (
            <div className="font-mono text-[10px] text-[#8a1a1a] bg-[#ffecec] border border-[#f0a0a0] px-3 py-1.5 rounded-sm">
              {error}
            </div>
          )}
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={onClose}
              className="font-rajdhani text-xs font-semibold px-3.5 py-[5px] border border-[#dce6f8] bg-white text-[#6a8aaf] rounded-sm hover:bg-[#f0f4ff] transition-colors"
            >
              CANCELAR
            </button>
            <button
              onClick={handleSave}
              className="font-rajdhani text-xs font-semibold px-3.5 py-[5px] border border-[#5a80df] bg-[#eaf0ff] text-[#1a3a7f] rounded-sm hover:bg-[#d8e8ff] transition-colors"
            >
              SALVAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
