import { parseCsv } from '../../utils/loadCompanies'
import { rankRows, summarise, formatValue, toNumber } from '../../utils/companies'
import { generateCopy, buildFallbackCopy, type BlogCopy } from './generateCopy'

export interface BuiltReport {
  datasetName: string
  valueKey: string
  headers: string[]
  stats: { count: number; total: number; average: number; median: number; max: number }
  table: { rank: number; value: number; cells: string[] }[]
  copy: BlogCopy
}

function isMoneyColumn(key: string): boolean {
  return /raised|revenue|price|funding|cost|sales|income|value|£|\$/i.test(key)
}

function pickValueColumn(firstRow: Record<string, string>, headers: string[]): string {
  const money = headers.find(isMoneyColumn)
  if (money) return money

  const numeric = headers.find((h) => {
    const value = (firstRow[h] ?? '').trim()
    return value !== '' && !Number.isNaN(Number(value))
  })

  return numeric ?? headers[0] ?? ''
}

function pickNameColumn(firstRow: Record<string, string>, headers: string[]): string {
  const preferred = headers.find(h => /^(company|name|title)$/i.test(h.trim()))
  if (preferred) return preferred

  const textColumn = headers.find((h) => {
    const value = (firstRow[h] ?? '').trim()
    return value !== '' && Number.isNaN(Number(value))
  })

  return textColumn ?? headers[0] ?? ''
}

function pickGroupColumn(rows: Record<string, string>[], headers: string[], excluded: string[]): string | null {
  for (const h of headers.filter(h => !excluded.includes(h))) {
    const values = rows.map(r => (r[h] ?? '').trim()).filter(v => v !== '')
    if (values.length === 0) continue
    if (values.every(v => !Number.isNaN(Number(v)))) continue
    const distinct = new Set(values).size
    if (distinct >= 2 && distinct <= 12) return h
  }
  return null
}

function buildGroupInsights(
  rows: Record<string, string>[],
  groupKey: string,
  valueKey: string,
  hasTotal: boolean,
): string[] {
  const groups = new Map<string, { count: number; total: number }>()

  for (const row of rows) {
    const name = (row[groupKey] ?? '').trim()
    if (!name) continue
    const entry = groups.get(name) ?? { count: 0, total: 0 }
    entry.count += 1
    entry.total += toNumber(row[valueKey]) ?? 0
    groups.set(name, entry)
  }

  if (groups.size === 0) return []

  const byCount = [...groups.entries()].sort((a, b) => b[1].count - a[1].count)
  const [topCountName, topCountStats] = byCount[0]

  const insights = [
    `${topCountName} has the most entries by ${groupKey}, with ${topCountStats.count} of ${rows.length} entries.`,
  ]

  if (hasTotal) {
    const byTotal = [...groups.entries()].sort((a, b) => b[1].total - a[1].total)
    const [topTotalName, topTotalStats] = byTotal[0]
    insights.push(`${topTotalName} has the largest combined ${valueKey}, at ${formatValue(topTotalStats.total, valueKey)}.`)
  }

  insights.push(`The ${groupKey} column has ${groups.size} distinct values across the entries.`)

  return insights
}

export async function buildReport(event: any, csv: string, requestedKey: string | undefined, datasetName: string): Promise<BuiltReport> {
  const rows = parseCsv(csv)
  const firstRow = rows[0]

  if (!firstRow) {
    throw createError({ statusCode: 400, statusMessage: 'No rows found in the CSV' })
  }

  const headers = Object.keys(firstRow)

  if (requestedKey && !headers.includes(requestedKey)) {
    throw createError({ statusCode: 400, statusMessage: `Column "${requestedKey}" not found` })
  }

  const valueKey = requestedKey ?? pickValueColumn(firstRow, headers)
  const hasTotal = isMoneyColumn(valueKey)
  const nameColumn = pickNameColumn(firstRow, headers)
  const ranked = rankRows(rows, valueKey)
  const stats = summarise(rows, valueKey)

  const topFiveTotal = ranked.slice(0, 5).reduce((sum, r) => sum + r.value, 0)
  const topShare = hasTotal && stats.total > 0
    ? `${((topFiveTotal / stats.total) * 100).toFixed(1)}%`
    : 'not applicable'

  const top = ranked.slice(0, 5).map(r => ({
    name: r.row[nameColumn] ?? '',
    value: formatValue(r.value, valueKey),
  }))

  const table = ranked.map(r => ({
    rank: r.rank,
    value: r.value,
    cells: headers.map(h => r.row[h] ?? ''),
  }))

  const sample = rows.slice(0, 5).map(row => headers.map(h => `${h}: ${row[h] ?? ''}`).join('; '))

  const groupKey = pickGroupColumn(rows, headers, [nameColumn, valueKey])
  const insights = groupKey ? buildGroupInsights(rows, groupKey, valueKey, hasTotal) : []

  const facts = {
    datasetName,
    columns: headers.join(', '),
    valueKey,
    hasTotal,
    count: stats.count,
    total: formatValue(stats.total, valueKey),
    median: formatValue(stats.median, valueKey),
    max: formatValue(stats.max, valueKey),
    topShare,
    top,
    sample,
    insights,
  }

  let copy: BlogCopy
  try {
    copy = await generateCopy(event, facts)
  } catch (err) {
    console.error('Gemini call failed', err)
    copy = buildFallbackCopy(facts)
  }

  return { datasetName, valueKey, headers, stats, table, copy }
}