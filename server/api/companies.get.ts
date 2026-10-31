import { loadCompanies } from '../../utils/loadCompanies'
import { rankRows, summarise } from '../../utils/companies'

export default defineEventHandler(() => {
  const rows = loadCompanies('fintech_companies_seed.csv')
  const ranked = rankRows(rows, 'Total Raised')

  return {
    stats: summarise(rows, 'Total Raised'),
    companies: ranked.map(r => ({
      rank: r.rank,
      company: r.row.Company,
      region: r.row.Region,
      stage: r.row.Stage,
      employees: r.row.Employees,
      raised: r.value,
      website: r.row.Website,
      industries: r.row.Industries,
    })),
  }
})