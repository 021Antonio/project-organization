interface StatsBarProps {
  total: number
  active: number
  cleared: number
  overdue: number
  xp: number
}

export default function StatsBar({ total, active, cleared, overdue, xp }: StatsBarProps) {
  return (
    <div className="flex flex-wrap items-center bg-white border-b border-[#dce6f8] px-3 sm:px-[18px] py-2.5 gap-y-2">
      <div className="flex-1 min-w-[60px] flex flex-col gap-0.5 pr-3 sm:pr-4 border-r border-[#e8eef8]">
        <span className="font-mono text-[9px] text-[#8aaacf] tracking-[0.12em]">Total</span>
        <span className="text-lg sm:text-xl font-bold text-[#1a2a4f] leading-none">{total}</span>
      </div>
      <div className="flex-1 min-w-[60px] flex flex-col gap-0.5 px-3 sm:px-4 border-r border-[#e8eef8]">
        <span className="font-mono text-[9px] text-[#8aaacf] tracking-[0.12em]">Active</span>
        <span className="text-lg sm:text-xl font-bold text-[#2a50bf] leading-none">{active}</span>
      </div>
      <div className="flex-1 min-w-[60px] flex flex-col gap-0.5 px-3 sm:px-4 border-r border-[#e8eef8]">
        <span className="font-mono text-[9px] text-[#8aaacf] tracking-[0.12em]">Cleared</span>
        <span className="text-lg sm:text-xl font-bold text-[#0a7a4a] leading-none">{cleared}</span>
      </div>
      <div className="flex-1 min-w-[60px] flex flex-col gap-0.5 px-3 sm:px-4 border-r border-[#e8eef8] sm:border-r">
        <span className="font-mono text-[9px] text-[#8aaacf] tracking-[0.12em]">Overdue</span>
        <span className="text-lg sm:text-xl font-bold text-[#bf3a20] leading-none">{overdue}</span>
      </div>
      <div className="hidden sm:block flex-[2]" />
      <div className="flex-1 min-w-[60px] flex flex-col gap-0.5 items-end border-none">
        <span className="font-mono text-[9px] text-[#8aaacf] tracking-[0.12em]">XP Total</span>
        <span className="text-lg sm:text-xl font-bold text-[#1a3a7f] leading-none">{xp}</span>
      </div>
    </div>
  )
}
