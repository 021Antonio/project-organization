import { useState, useEffect } from 'react'
import { Quest } from '../api/quests'
import { RANK_STYLES, RANK_ORDER, type Rank } from '../lib/ranks'
import { getTagColor, TAG_STYLE } from '../lib/tags'

interface QuestCardProps {
  quest: Quest
  onComplete: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void
}

function fmtDt(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtCountdown(dlMs: number) {
  const diff = dlMs - Date.now()
  if (diff < 0) return 'VENCEU'
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ${Math.floor((diff % 3600000) / 60000)}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

function timerBarColor(pct: number) {
  if (pct > 50) return '#4a70df'
  if (pct > 20) return '#d4a030'
  return '#e03a1a'
}

export default function QuestCard({
  quest,
  onComplete,
  onEdit,
  onArchive,
  onDelete,
  onDragStart,
  onDragEnd,
}: QuestCardProps) {
  const [timerPct, setTimerPct] = useState(100)
  const [timerLabel, setTimerLabel] = useState('')
  const [timerCls, setTimerCls] = useState('')

  const isActive = quest.status === 'active'
  const hasDeadline = !!quest.deadline
  const isOverdue = isActive && hasDeadline && new Date(quest.deadline!) < new Date()

  useEffect(() => {
    if (!isActive || !hasDeadline) return

    function update() {
      const dl = new Date(quest.deadline!).getTime()
      const created = new Date(quest.created_at).getTime()
      const total = dl - created
      const remaining = dl - Date.now()

      if (remaining <= 0) {
        setTimerPct(0)
        setTimerLabel('VENCEU')
        setTimerCls('text-[#bf3a20]')
        return
      }

      const pct = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)))
      setTimerPct(pct)
      setTimerLabel(fmtCountdown(dl))
      setTimerCls(pct < 15 ? 'text-[#bf3a20]' : pct < 35 ? 'text-[#bf7a10]' : 'text-[#8aaacf]')
    }

    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [quest.deadline, quest.created_at, isActive, hasDeadline])

  const rankStyle = RANK_STYLES[quest.rank as Rank] || RANK_STYLES.E
  const isCleared = quest.status === 'cleared'
  const isScheduled = quest.status === 'scheduled'

  let cardClasses = 'bg-white border border-[#dce6f8] rounded-[3px] p-[11px_13px] mb-[7px] cursor-grab relative transition-all duration-150 group'
  if (isOverdue) cardClasses += ' border-l-[3px] border-l-[#a00000] bg-[#fffafa]'
  else if (isActive && hasDeadline && timerPct < 15) cardClasses += ' border-l-[3px] border-l-[#e03a1a]'
  else if (isCleared) cardClasses += ' opacity-55'
  else if (isScheduled) cardClasses += ' border-l-[3px] border-l-[#7a9acf] bg-[#f8faff]'

  return (
    <div
      className={cardClasses}
      data-quest-card
      data-id={quest.id}
      draggable
      onDragStart={(e) => onDragStart(e, quest.id)}
      onDragEnd={onDragEnd}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <span className="text-[13px] font-semibold text-[#1a2540] leading-tight flex-1">
          {quest.title}
        </span>
        <div className="flex items-center gap-[3px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          {isActive && (
            <button
              onClick={() => onComplete(quest.id)}
              className="w-[22px] h-[22px] rounded-sm border border-[#dce6f8] bg-[#f8faff] flex items-center justify-center text-[#8aaacf] text-xs hover:bg-[#e0f5ee] hover:border-[#8ad4b8] hover:text-[#0a6a46] transition-all"
              title="Concluir"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onEdit(quest.id)}
            className="w-[22px] h-[22px] rounded-sm border border-[#dce6f8] bg-[#f8faff] flex items-center justify-center text-[#8aaacf] text-xs hover:bg-[#eaf0ff] hover:border-[#5a80df] hover:text-[#1a3a7f] transition-all"
            title="Editar"
          >
            ✎
          </button>
          <button
            onClick={() => onArchive(quest.id)}
            className="w-[22px] h-[22px] rounded-sm border border-[#dce6f8] bg-[#f8faff] flex items-center justify-center text-[#8aaacf] text-xs hover:bg-[#fff8e8] hover:border-[#d4a040] hover:text-[#7a4a00] transition-all"
            title="Arquivar"
          >
            ▫
          </button>
          <button
            onClick={() => onDelete(quest.id)}
            className="w-[22px] h-[22px] rounded-sm border border-[#dce6f8] bg-[#f8faff] flex items-center justify-center text-[#8aaacf] text-xs hover:bg-[#ffecec] hover:border-[#f0a0a0] hover:text-[#8a1a1a] transition-all"
            title="Apagar"
          >
            ✕
          </button>
        </div>
        {/* Rank pill */}
        <span
          className="font-mono text-[11px] font-bold px-[7px] py-px rounded-sm flex-shrink-0 tracking-[0.05em]"
          style={{
            background: rankStyle.bg,
            color: rankStyle.color,
            border: `1px solid ${rankStyle.border}`,
          }}
        >
          {quest.rank}
        </span>
      </div>

      {/* Scheduled label */}
      {isScheduled && quest.activate_at && (
        <div className="font-mono text-[9px] text-[#4a6aaf] flex items-center gap-[3px] mb-1.5">
          ⏰ ATIVA EM: {fmtDt(quest.activate_at)}
        </div>
      )}

      {/* Description */}
      {quest.description && (
        <p className="text-[11px] text-[#6a8aaf] leading-[1.45] mb-2">
          {quest.description}
        </p>
      )}

      {/* Timer block (active with deadline) */}
      {isActive && hasDeadline && (
        <div className="my-1.5">
          <div className="h-[3px] bg-[#eaf0ff] rounded-sm overflow-hidden mb-1">
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{ width: `${timerPct}%`, background: timerBarColor(timerPct) }}
            />
          </div>
          <div className={`font-mono text-[9px] flex justify-between ${timerCls}`}>
            <span>{timerLabel}</span>
            <span>{fmtDt(quest.deadline!)}</span>
          </div>
        </div>
      )}

      {/* Footer: tags + deadline */}
      <div className="flex items-center gap-[5px] flex-wrap">
        {quest.tags?.map((tag) => {
          const tagColor = getTagColor(tag)
          const style = TAG_STYLE[tagColor]
          return (
            <span
              key={tag}
              className="font-mono text-[9px] font-semibold px-[7px] py-[2px] rounded-sm tracking-[0.05em]"
              style={{
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
              }}
            >
              {tag}
            </span>
          )
        })}
        {hasDeadline && !isActive && (
          <span
            className={`font-mono text-[9px] ml-auto flex items-center gap-[3px] ${
              isOverdue ? 'text-[#c02a10]' : 'text-[#8aaacf]'
            }`}
          >
            📅 {fmtDt(quest.deadline!)}
          </span>
        )}
      </div>
    </div>
  )
}
