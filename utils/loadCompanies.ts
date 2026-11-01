import Papa from 'papaparse'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function parseCsv(csvText: string) {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  })
  return result.data
}

export function loadCompanies(filename: string) {
  const path = join(process.cwd(), 'data', filename)
  return parseCsv(readFileSync(path, 'utf-8'))
}