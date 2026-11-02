import { getReport } from '../../utils/reportStore'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const report = await getReport(slug)
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  return report
})