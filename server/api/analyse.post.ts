import { buildReport } from '../utils/buildReport'
import { makeSlug, saveReport } from '../utils/reportStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ csv?: string; valueKey?: string; datasetName?: string }>(event)

  if (!body?.csv || !body?.valueKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing csv or valueKey' })
  }

  const datasetName = body.datasetName?.replace(/[_-]+/g, ' ').trim() || 'Uploaded dataset'
  const report = await buildReport(event, body.csv, body.valueKey, datasetName)
  const slug = makeSlug(report.copy.title)

  await saveReport({
    slug,
    createdAt: new Date().toISOString(),
    ...report,
  })

  return { slug }
})