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
  <main v-if="data">
    <h1>Top 100 UK Fintech Companies by Funding Raised</h1>

    <p>
      Across the top 100 companies, {{ money.format(data.stats.total) }} has been raised.
      The average is {{ money.format(data.stats.average) }} and the median is
      {{ money.format(data.stats.median) }}. The largest raise belongs to
      {{ money.format(data.stats.max) }}.
    </p>

    <p>
      <NuxtLink to="/upload">Upload your own dataset</NuxtLink>
    </p>

    <section>
      <h2>Ranking</h2>
      <RankingTable :headers="data.headers" :rows="data.table" />
    </section>
  </main>
</template>

<style scoped>
main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; }
</style>