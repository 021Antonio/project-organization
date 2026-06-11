const TAG_COLORS = [
  'blue',
  'purple',
  'teal',
  'amber',
  'coral',
  'red',
  'green',
  'pink',
] as const

export type TagColor = (typeof TAG_COLORS)[number]

const STORAGE_KEY = 'hp_tag_colors'

function loadMap(): Record<string, TagColor> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, TagColor>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

let colorMap = loadMap()
let nextIndex = Object.keys(colorMap).length % TAG_COLORS.length

export function getTagColor(tagName: string): TagColor {
  const key = tagName.toLowerCase().trim()
  if (colorMap[key]) return colorMap[key]

  const color = TAG_COLORS[nextIndex % TAG_COLORS.length]
  nextIndex++
  colorMap[key] = color
  saveMap(colorMap)
  return color
}

export const TAG_STYLE: Record<
  TagColor,
  { bg: string; color: string; border: string }
> = {
  blue: { bg: '#e0eaff', color: '#1a4aaf', border: '#aac0ef' },
  purple: { bg: '#ede8ff', color: '#4a1abf', border: '#b8a8ef' },
  teal: { bg: '#e0f5ee', color: '#0a6a46', border: '#8ad4b8' },
  amber: { bg: '#fff3dc', color: '#7a4a00', border: '#e0b860' },
  coral: { bg: '#fff0ec', color: '#8a2a10', border: '#f0a888' },
  red: { bg: '#ffecec', color: '#8a1a1a', border: '#f0a0a0' },
  green: { bg: '#e8f5dc', color: '#2a5a0a', border: '#90c860' },
  pink: { bg: '#fce8f4', color: '#7a1a50', border: '#e0a0cc' },
}
