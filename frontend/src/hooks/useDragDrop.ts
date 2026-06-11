import { useRef, useCallback } from 'react'

export type ColumnId = 'pending' | 'active' | 'cleared'

interface UseDragDropOptions {
  onDrop: (questId: string, targetColumn: ColumnId) => void
}

export function useDragDrop({ onDrop }: UseDragDropOptions) {
  const draggedId = useRef<string | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, questId: string) => {
      draggedId.current = questId
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', questId)
      const el = e.currentTarget
      requestAnimationFrame(() => el.classList.add('opacity-35', 'scale-[0.98]'))
    },
    []
  )

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-35', 'scale-[0.98]')
    draggedId.current = null
    // Remove all placeholders
    document.querySelectorAll('[data-placeholder]').forEach((el) => el.remove())
    document
      .querySelectorAll('[data-drop-zone]')
      .forEach((z) => z.classList.remove('bg-[#eaf3ff]', 'border-dashed', 'border-[#5a80df]'))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const zone = e.currentTarget
    zone.classList.add('bg-[#eaf3ff]')

    // Manage placeholder
    let placeholder = zone.querySelector('[data-placeholder]') as HTMLElement | null
    if (!placeholder) {
      placeholder = document.createElement('div')
      placeholder.setAttribute('data-placeholder', 'true')
      placeholder.className =
        'h-11 border-[1.5px] border-dashed border-[#5a80df] bg-[#eaf0ff] rounded opacity-50 mb-2'
      zone.appendChild(placeholder)
    }

    // Position placeholder based on mouse position
    const cards = [...zone.querySelectorAll('[data-quest-card]:not([data-placeholder])')]
    const afterEl = cards.reduce<{ offset: number; element: Element | null }>(
      (closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = e.clientY - box.top - box.height / 2
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child }
        }
        return closest
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    )

    if (afterEl.element) {
      zone.insertBefore(placeholder, afterEl.element)
    } else {
      zone.appendChild(placeholder)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const zone = e.currentTarget
    if (!zone.contains(e.relatedTarget as Node)) {
      zone.classList.remove('bg-[#eaf3ff]')
      const placeholder = zone.querySelector('[data-placeholder]')
      if (placeholder) placeholder.remove()
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, column: ColumnId) => {
      e.preventDefault()
      const zone = e.currentTarget
      zone.classList.remove('bg-[#eaf3ff]')
      const placeholder = zone.querySelector('[data-placeholder]')
      if (placeholder) placeholder.remove()

      const questId = draggedId.current || e.dataTransfer.getData('text/plain')
      if (questId) {
        onDrop(questId, column)
      }
      draggedId.current = null
    },
    [onDrop]
  )

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
