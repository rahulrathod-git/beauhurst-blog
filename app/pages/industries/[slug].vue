<script setup lang="ts">
const route = useRoute()
const { data: report, error } = await useFetch(`/api/reports/${route.params.slug}`)

if (error.value || !report.value) {
  throw createError({ statusCode: 404, statusMessage: 'Report not found', fatal: true })
}

useSeoMeta({
  title: () => report.value?.copy.title ?? '',
  description: () => report.value?.copy.metaDescription ?? '',
})
</script>

<template>
  <main v-if="report">
    <h1>{{ report.copy.title }}</h1>
    <p>{{ report.copy.intro }}</p>
    <ul>
      <li v-for="line in report.copy.insights" :key="line">{{ line }}</li>
    </ul>

    <section>
      <h2>Results</h2>
      <p>
        Count {{ report.stats.count }}, total {{ report.stats.total }},
        average {{ report.stats.average }}, median {{ report.stats.median }},
        max {{ report.stats.max }}.
      </p>
      <ol>
        <li v-for="row in report.top" :key="row.rank">{{ row.name }}: {{ row.value }}</li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; }
</style>