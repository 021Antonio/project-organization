import { Quest } from '../api/quests'
import QuestCard from './QuestCard'
import { ColumnId } from '../hooks/useDragDrop'

interface ColumnProps {
  id: ColumnId
  title: string
  quests: Quest[]
  color: string
  titleColor?: string
  onComplete: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, column: ColumnId) => void
}

export default function Column({
  id,
  title,
  quests,
  color,
  titleColor,
  onComplete,
  onEdit,
  onArchive,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: ColumnProps) {
  return (
    <div>
      {/* Column header */}
      <div className="flex items-center gap-[7px] px-0.5 pb-[9px] border-b border-[#dce6f8] mb-2">
        <div className="w-[3px] h-[14px] rounded-sm" style={{ background: color }} />
        <span
          className="text-[11px] font-semibold tracking-[0.14em] uppercase flex-1"
          style={{ color: titleColor || '#4a6aaf' }}
        >
          {title}
        </span>
        <span className="font-mono text-[10px] text-[#8aaacf] border border-[#dce6f8] px-1.5 py-px rounded-sm bg-white">
          {String(quests.length).padStart(2, '0')}
        </span>
      </div>

      {/* Drop zone */}
      <div
        data-drop-zone
        data-col={id}
        className="min-h-[60px] rounded-[3px] transition-all duration-150"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, id)}
      >
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onComplete={onComplete}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
}
