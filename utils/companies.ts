export type Row = Record<string, string>

export function toNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[£$,\s]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function rankRows(rows: Row[], valueKey: string) {
  return rows
    .map(row => ({ row, value: toNumber(row[valueKey]) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({ rank: i + 1, value: item.value, row: item.row }))
}

export function summarise(rows: Row[], valueKey: string) {
  const values = rows
    .map(row => toNumber(row[valueKey]))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)

  const total = values.reduce((sum, v) => sum + v, 0)
  const mid = Math.floor(values.length / 2)

  const median = values.length === 0
    ? 0
    : values.length % 2
      ? (values[mid] ?? 0)
      : ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2

  return {
    count: rows.length,
    total,
    average: values.length ? total / values.length : 0,
    median,
    max: values.at(-1) ?? 0,
  }
}