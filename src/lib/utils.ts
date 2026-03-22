const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateInviteCode(length = 6): string {
  return Array.from({ length }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}

export function formatSteps(steps: number): string {
  return steps.toLocaleString()
}

export function getProgressPercent(steps: number, goal: number): number {
  return Math.min(100, Math.round((steps / goal) * 100))
}

export function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}
