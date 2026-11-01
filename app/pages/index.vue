<script setup lang="ts">
const { data } = await useFetch('/api/companies')

const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

useSeoMeta({
  title: '100 UK Fintech Companies by Funding Raised',
  description: 'A ranking of the top 100 UK fintech companies by total funding raised, with headline statistics on the sector.',
  ogTitle: '100 UK Fintech Companies by Funding Raised',
  ogDescription: 'A ranking of the top 100 UK fintech companies by total funding raised.',
})
</script>

<template>
  <main>
    <h1>Top 100 UK Fintech Companies by Funding Raised</h1>
    <p>
      <NuxtLink to="/upload">Upload your own dataset</NuxtLink>
    </p>

    <p v-if="data">
      Across the top 100 companies, {{ money.format(data.stats.total) }} has been raised.
      The average is {{ money.format(data.stats.average) }} and the median is
      {{ money.format(data.stats.median) }}. The largest raise belongs to
      {{ data.companies[0]?.company }}, at {{ money.format(data.stats.max) }}.
    </p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Company</th>
            <th>Region</th>
            <th>Stage</th>
            <th>Employees</th>
            <th>Total raised</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in data?.companies" :key="c.rank">
            <td>{{ c.rank }}</td>
            <td><a :href="c.website" target="_blank" rel="noopener">{{ c.company }}</a></td>
            <td>{{ c.region }}</td>
            <td>{{ c.stage }}</td>
            <td>{{ c.employees }}</td>
            <td>{{ money.format(c.raised) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
</style>