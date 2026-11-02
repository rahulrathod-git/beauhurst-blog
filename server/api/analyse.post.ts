import { parseCsv } from '../../utils/loadCompanies'
import { rankRows, summarise, formatValue } from '../../utils/companies'
import { generateCopy, buildFallbackCopy, type BlogCopy } from '../utils/generateCopy'
import { makeSlug, saveReport } from '../utils/reportStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ csv?: string; valueKey?: string; datasetName?: string }>(event)

  if (!body?.csv || !body?.valueKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing csv or valueKey' })
  }

  const rows = parseCsv(body.csv)
  const firstRow = rows[0]

  if (!firstRow) {
    throw createError({ statusCode: 400, statusMessage: 'No rows found in the CSV' })
  }

  if (!(body.valueKey in firstRow)) {
    throw createError({ statusCode: 400, statusMessage: `Column "${body.valueKey}" not found` })
  }

  const datasetName = body.datasetName?.replace(/[_-]+/g, ' ').trim() || 'Uploaded dataset'
  const valueKey = body.valueKey
  const headers = Object.keys(firstRow)
  const nameColumn = pickNameColumn(firstRow, headers)
  const ranked = rankRows(rows, valueKey)
  const stats = summarise(rows, valueKey)

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
    top,
  }

  let copy: BlogCopy
  try {
    copy = await generateCopy(event, facts)
  } catch (err) {
    console.error('Gemini call failed', err)
    copy = buildFallbackCopy(facts, valueKey)
  }

  const slug = makeSlug(copy.title)

  await saveReport({
    slug,
    createdAt: new Date().toISOString(),
    datasetName,
    valueKey,
    headers,
    stats,
    table,
    copy,
  })

  return { slug }
})

function pickNameColumn(firstRow: Record<string, string>, headers: string[]): string {
  const preferred = headers.find(h => /^(company|name|title)$/i.test(h.trim()))
  if (preferred) return preferred

  const textColumn = headers.find((h) => {
    const value = (firstRow[h] ?? '').trim()
    return value !== '' && Number.isNaN(Number(value))
  })

  return textColumn ?? headers[0] ?? ''
}