<script setup lang="ts">
const route = useRoute()
const { data: report, error } = await useFetch(`/api/reports/${route.params.slug}`)

if (error.value || !report.value) {
  throw createError({ statusCode: 404, statusMessage: 'Report not found', fatal: true })
}

const published = computed(() =>
  report.value
    ? new Date(report.value.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '',
)

useSeoMeta({
  title: () => report.value?.copy.title ?? '',
  description: () => report.value?.copy.metaDescription ?? '',
})

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
}
</script>

<template>
  <main v-if="report" class="report">
    <article>
      <header>
        <h1>{{ report.copy.title }}</h1>
        <p class="description">{{ report.copy.metaDescription }}</p>
        <p class="meta">Published {{ published }} · Source: {{ report.datasetName }}</p>
      </header>

      <section class="intro">
        <p v-for="(p, i) in paragraphs(report.copy.intro)" :key="i">{{ p }}</p>
      </section>

      <section v-for="(s, i) in report.copy.sections ?? []" :key="i">
        <h2>{{ s.heading }}</h2>
        <p v-for="(p, j) in paragraphs(s.body)" :key="j">{{ p }}</p>
      </section>

      <section>
        <h2>Full ranking</h2>
        <RankingTable :headers="report.headers" :rows="report.table" :value-key="report.valueKey" />
      </section>
    </article>
  </main>
</template>

<style scoped>
.report { max-width: 860px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; color: #111; line-height: 1.6; }
h1 { font-size: 2rem; line-height: 1.25; margin: 0 0 0.75rem; }
h2 { margin-top: 2.5rem; }
.description { font-size: 1.1rem; color: #444; margin: 0 0 0.75rem; }
.meta { font-size: 0.9rem; color: #666; margin: 0 0 1rem; }
.intro p:first-child { font-size: 1.05rem; }
</style>