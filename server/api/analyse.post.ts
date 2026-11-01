import { parseCsv } from '../../utils/loadCompanies'
import { rankRows, summarise, formatGBP } from '../../utils/companies'
import { generateCopy } from '../utils/generateCopy'

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

  const nameColumn = pickNameColumn(firstRow, Object.keys(firstRow))
  const ranked = rankRows(rows, body.valueKey)
  const stats = summarise(rows, body.valueKey)
  const top = ranked.slice(0, 5).map(r => ({
    rank: r.rank,
    name: r.row[nameColumn] ?? '',
    value: r.value,
  }))

  let copy: Awaited<ReturnType<typeof generateCopy>> | null = null
  try {
    copy = await generateCopy(event, {
      datasetName: body.datasetName ?? 'Uploaded dataset',
      count: stats.count,
      total: formatGBP(stats.total),
      median: formatGBP(stats.median),
      max: formatGBP(stats.max),
      top: top.map(t => ({ name: t.name, value: formatGBP(t.value) })),
    })
  } catch (err) {
    console.error('Gemini call failed', err)
  }

  return { stats, top, copy }
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