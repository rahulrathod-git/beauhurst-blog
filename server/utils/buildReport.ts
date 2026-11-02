import { parseCsv } from '../../utils/loadCompanies'
import { rankRows, summarise, formatValue } from '../../utils/companies'
import { generateCopy, buildFallbackCopy, type BlogCopy } from './generateCopy'

export interface BuiltReport {
  datasetName: string
  valueKey: string
  headers: string[]
  stats: { count: number; total: number; average: number; median: number; max: number }
  table: { rank: number; value: number; cells: string[] }[]
  copy: BlogCopy
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

export async function buildReport(event: any, csv: string, valueKey: string, datasetName: string): Promise<BuiltReport> {
  const rows = parseCsv(csv)
  const firstRow = rows[0]

  if (!firstRow) {
    throw createError({ statusCode: 400, statusMessage: 'No rows found in the CSV' })
  }

  if (!(valueKey in firstRow)) {
    throw createError({ statusCode: 400, statusMessage: `Column "${valueKey}" not found` })
  }

  const headers = Object.keys(firstRow)
  const nameColumn = pickNameColumn(firstRow, headers)
  const ranked = rankRows(rows, valueKey)
  const stats = summarise(rows, valueKey)

  const topFiveTotal = ranked.slice(0, 5).reduce((sum, r) => sum + r.value, 0)
  const topShare = stats.total > 0
    ? `${((topFiveTotal / stats.total) * 100).toFixed(1)}%`
    : 'not available'

  const top = ranked.slice(0, 5).map(r => ({
    name: r.row[nameColumn] ?? '',
    value: formatValue(r.value, valueKey),
  }))

  const table = ranked.map(r => ({
    rank: r.rank,
    value: r.value,
    cells: headers.map(h => r.row[h] ?? ''),
  }))

  const facts = {
    datasetName,
    valueKey,
    count: stats.count,
    total: formatValue(stats.total, valueKey),
    median: formatValue(stats.median, valueKey),
    max: formatValue(stats.max, valueKey),
    topShare,
    top,
  }

  let copy: BlogCopy
  try {
    copy = await generateCopy(event, facts)
  } catch (err) {
    console.error('Gemini call failed', err)
    copy = buildFallbackCopy(facts, valueKey)
  }

  return { datasetName, valueKey, headers, stats, table, copy }
}