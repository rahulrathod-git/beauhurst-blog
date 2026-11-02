import type { BlogCopy } from './generateCopy'

export interface TableRow {
  rank: number
  value: number
  cells: string[]
}

export interface StoredReport {
  slug: string
  createdAt: string
  datasetName: string
  valueKey: string
  headers: string[]
  stats: { count: number; total: number; average: number; median: number; max: number }
  table: TableRow[]
  copy: BlogCopy
}

export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${base || 'report'}-${Date.now().toString(36)}`
}

const store = () => useStorage<StoredReport>('reports')

export async function saveReport(report: StoredReport) {
  await store().setItem(report.slug, report)
}

export async function getReport(slug: string) {
  return await store().getItem(slug)
}