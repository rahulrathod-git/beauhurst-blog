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
  return /raised|revenue|price|funding|cost|sales|income|£|\$/i.test(key)
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

  const top = ranked.slice(0, 5).map(r => ({
    name: r.row[nameColumn] ?? '',
    value: formatValue(r.value, valueKey),
  }))

  const table = rows.map((row, i) => ({
    rank: i + 1,
    value: toNumber(row[valueKey]) ?? 0,
    cells: headers.map(h => row[h] ?? ''),
  }))

  const sample = rows.slice(0, 5).map(row => headers.map(h => `${h}: ${row[h] ?? ''}`).join('; '))

  const facts = {
    datasetName,
    columns: headers.join(', '),
    valueKey,
    hasTotal,
    count: stats.count,
    total: hasTotal ? formatValue(stats.total, valueKey) : 'not applicable',
    median: formatValue(stats.median, valueKey),
    max: formatValue(stats.max, valueKey),
    top,
    sample,
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