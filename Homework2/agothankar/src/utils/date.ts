export function toDate(x: any): Date | null {
  if (!x) return null
  const d = x instanceof Date ? x : new Date(x)
  return isNaN(d.getTime()) ? null : d
}

export function dayKeyUTC(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDayKeyUTC(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}