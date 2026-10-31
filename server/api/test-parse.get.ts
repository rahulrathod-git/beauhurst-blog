import { loadCompanies } from '../../utils/loadCompanies'
export default defineEventHandler(() => {
  const rows = loadCompanies('fintech_companies_seed.csv')
  return {
    count: rows.length,
    firstThree: rows.slice(0, 3),
    columns: Object.keys(rows[0] ?? {}),
  }
})