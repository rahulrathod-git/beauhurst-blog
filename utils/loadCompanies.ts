import Papa from 'papaparse'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function loadCompanies(filename: string) {
  const path = join(process.cwd(), 'data', filename)
  const csvText = readFileSync(path, 'utf-8')

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  })

  return result.data
}