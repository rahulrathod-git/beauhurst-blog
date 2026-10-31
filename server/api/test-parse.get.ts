import { loadCompanies } from '../../utils/loadCompanies'
import { rankRows, summarise } from '../../utils/companies'

export default defineEventHandler(() => {
  const rows = loadCompanies('fintech_companies_seed.csv')
  const ranked = rankRows(rows, 'Total Raised')

  return {
    stats: summarise(rows, 'Total Raised'),
    top3: ranked.slice(0, 3).map(r => ({
      rank: r.rank,
      company: r.row.Company,
      raised: r.value,
    })),
  }
})