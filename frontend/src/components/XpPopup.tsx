import { useEffect, useState } from 'react'

interface XpPopupProps {
  xp: number
  x: number
  y: number
  onDone: () => void
}

export default function XpPopup({ xp, x, y, onDone }: XpPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 900)
    return () => clearTimeout(timer)
  }, [onDone])

  const isPositive = xp >= 0
  const bg = isPositive ? '#e0f5ee' : '#ffecec'
  const color = isPositive ? '#0a6a46' : '#8a1a1a'
  const border = isPositive ? '#8ad4b8' : '#f0a0a0'

  return (
    <div
      className="fixed pointer-events-none z-[400] font-mono font-bold text-xs transition-all duration-300"
      style={{
        left: x,
        top: y,
        background: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: 2,
        padding: '3px 8px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(-10px)' : 'translateY(0)',
      }}
    >
      {isPositive ? '+' : ''}
      {xp} XP
    </div>
  )
}
