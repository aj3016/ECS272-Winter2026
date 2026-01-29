import * as d3 from 'd3'
import { toDate, dayKeyUTC, parseDayKeyUTC } from './date'

export type MedalType = 'Gold' | 'Silver' | 'Bronze'
export const MEDALS: MedalType[] = ['Gold', 'Silver', 'Bronze']

export type MedallistRow = {
  medal_date: Date
  medal_type: string
  country: string
  discipline: string
}

export type CountryTotal = { country: string; total: number }

export type DailySeriesPoint = { day: Date; value: number }

export type DisciplineCount = { discipline: string; count: number }

export function normalizeMedalType(raw: unknown): MedalType | null {
  const s = String(raw ?? '').trim()
  if (s.startsWith('Gold')) return 'Gold'
  if (s.startsWith('Silver')) return 'Silver'
  if (s.startsWith('Bronze')) return 'Bronze'
  return null
}

let _cache: MedallistRow[] | null = null

export async function loadMedallistsCached(): Promise<MedallistRow[]> {
  if (_cache) return _cache

  const raw = await d3.csv('../../data/medallists.csv', d3.autoType)

  const out: MedallistRow[] = []
  for (const r of raw as any[]) {
    const md = toDate(r.medal_date)
    const country = String(r.country ?? '').trim()
    const discipline = String(r.discipline ?? '').trim()
    const medal_type = String(r.medal_type ?? '').trim()

    if (!md || !country || !discipline || !medal_type) continue

    out.push({
      medal_date: md,
      medal_type,
      country,
      discipline
    })
  }

  _cache = out
  return out
}

export function clearMedallistsCache() {
  _cache = null
}

/** ---------- View 1 ---------- */

export type CountryMedalsDDI = {
  country: string
  Gold: number
  Silver: number
  Bronze: number
  total: number
  disciplines: number
  ddi: number
}

export function computeCountryMedalsDDI(
  rows: MedallistRow[],
  topN: number,
  sortByDDIDesc: boolean = true
): CountryMedalsDDI[] {
  const map = new Map<
    string,
    { Gold: number; Silver: number; Bronze: number; total: number; discSet: Set<string> }
  >()

  for (const r of rows) {
    const medal = normalizeMedalType(r.medal_type)
    if (!medal) continue

    if (!map.has(r.country)) {
      map.set(r.country, { Gold: 0, Silver: 0, Bronze: 0, total: 0, discSet: new Set() })
    }
    const obj = map.get(r.country)!
    obj[medal] += 1
    obj.total += 1
    if (r.discipline) obj.discSet.add(r.discipline)
  }

  const arr: CountryMedalsDDI[] = Array.from(map.entries()).map(([country, v]) => {
    const disciplines = v.discSet.size
    const ddi = v.total > 0 ? disciplines / v.total : 0
    return { country, Gold: v.Gold, Silver: v.Silver, Bronze: v.Bronze, total: v.total, disciplines, ddi }
  })

  const top = arr.sort((a, b) => b.total - a.total).slice(0, topN)

  top.sort((a, b) => (sortByDDIDesc ? b.ddi - a.ddi : a.ddi - b.ddi))
  return top
}

export function topCountriesByTotal(rows: MedallistRow[], n: number): CountryTotal[] {
  const totals = d3.rollup(rows, v => v.length, d => d.country)
  return Array.from(totals.entries())
    .map(([country, total]) => ({ country, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n)
}

/** ---------- View 2 ---------- */

export function buildDailyCounts(
  rows: MedallistRow[],
  countries: string[]
): {
  days: Date[]
  dailyByCountry: Map<string, Map<string, number>> 
} {
  const cset = new Set(countries)
  const daySet = new Set<string>()
  const dailyByCountry = new Map<string, Map<string, number>>()

  for (const c of countries) dailyByCountry.set(c, new Map())

  for (const r of rows) {
    if (!cset.has(r.country)) continue
    const k = dayKeyUTC(r.medal_date)
    daySet.add(k)

    const m = dailyByCountry.get(r.country)!
    m.set(k, (m.get(k) ?? 0) + 1)
  }

  const dayKeys = Array.from(daySet).sort()
  const days = dayKeys.map(parseDayKeyUTC)
  return { days, dailyByCountry }
}

export function buildDailyStackMatrix(
  days: Date[],
  dailyByCountry: Map<string, Map<string, number>>,
  countries: string[]
) {
  const dayKeys = days.map(dayKeyUTC)
  const out: Array<any> = []

  for (const k of dayKeys) {
    const obj: any = { day: parseDayKeyUTC(k) }
    for (const c of countries) {
      obj[c] = dailyByCountry.get(c)?.get(k) ?? 0
    }
    out.push(obj)
  }
  return out
}

/** ---------- View 3 ---------- */

export function disciplineBreakdownForCountry(rows: MedallistRow[], country: string, topK: number): DisciplineCount[] {
  const filtered = rows.filter(r => r.country === country)
  const counts = d3.rollup(filtered, v => v.length, d => d.discipline)

  const sorted = Array.from(counts.entries())
    .map(([discipline, count]) => ({ discipline, count }))
    .sort((a, b) => b.count - a.count)

  const top = sorted.slice(0, topK)
  const rest = sorted.slice(topK)
  const restSum = rest.reduce((acc, d) => acc + d.count, 0)

  if (restSum > 0) top.push({ discipline: 'Other', count: restSum })
  return top
}
