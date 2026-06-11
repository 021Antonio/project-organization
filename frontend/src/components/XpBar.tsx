import { RANK_STYLES, type Rank } from '../lib/ranks'

interface XpBarProps {
  rank: string
  pct: number
  current: number
  next: number
}

export default function XpBar({ rank, pct, current, next }: XpBarProps) {
  const style = RANK_STYLES[rank as Rank] || RANK_STYLES.E

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 px-3 sm:px-[18px] py-[9px] border-b border-[#e0e8f8] bg-[#f8faff]">
      <span className="font-mono text-[10px] text-[#7a9acf] tracking-[0.1em] whitespace-nowrap">
        EXP
      </span>
      <div className="flex-1 min-w-[80px] h-[5px] bg-[#dce6f8] rounded-sm overflow-hidden order-3 sm:order-none w-full sm:w-auto">
        <div
          className="h-full bg-[#4a70df] relative transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#8ab0ff]" />
        </div>
      </div>
      <span className="font-mono text-[11px] text-[#1a3a7f] whitespace-nowrap text-right">
        {current} / {next} XP
      </span>
      <div
        className="font-mono text-[10px] tracking-[0.1em] whitespace-nowrap px-2 py-0.5 rounded-sm"
        style={{
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
        }}
      >
        RANK {rank}
      </div>
    </div>
  )
}
