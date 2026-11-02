<script setup lang="ts">
import type { StoredReport } from '../../server/utils/reportStore'

const props = withDefaults(defineProps<{
  report: StoredReport
  highlightBasis?: boolean
}>(), {
  highlightBasis: true,
})

const url = useRequestURL()
const canonical = `${url.origin}${url.pathname}`

const method = computed(() =>
  `This ranking uses the ${props.report.datasetName} dataset, supplied as a CSV file. The ${props.report.stats.count} entries are sorted by ${props.report.valueKey}, highest first. The figures in this article were calculated directly from that file, and the written commentary was generated from them.`,
)

const caption = computed(() =>
  `Full ranking of ${props.report.stats.count} entries, sorted by ${props.report.valueKey}, highest first.`,
)

const schema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: props.report.copy.title,
  description: props.report.copy.metaDescription,
  about: props.report.datasetName,
  mainEntityOfPage: canonical,
  author: { '@type': 'Organization', name: 'SEO Blog Generator' },
  publisher: { '@type': 'Organization', name: 'SEO Blog Generator' },
}))

useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(schema.value) }],
})

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
}
</script>

<template>
  <article class="blog">
    <header>
      <h1>{{ report.copy.title }}</h1>
      <p class="description">{{ report.copy.metaDescription }}</p>
    </header>

    <section class="intro">
      <p v-for="(p, i) in paragraphs(report.copy.intro)" :key="i">{{ p }}</p>
    </section>

    <section v-for="(s, i) in report.copy.sections" :key="i">
      <h2>{{ s.heading }}</h2>
      <p v-for="(p, j) in paragraphs(s.body)" :key="j">{{ p }}</p>
    </section>

    <section>
      <h2>How this ranking was built</h2>
      <p>{{ method }}</p>
    </section>

    <section>
      <h2>Full ranking</h2>
      <RankingTable
        :headers="report.headers"
        :rows="report.table"
        :value-key="highlightBasis ? report.valueKey : undefined"
        :caption="caption"
      />
    </section>
  </article>
</template>

<style scoped>
.blog {
  max-width: 860px;
  margin: 0 auto;
  line-height: 1.6;
}

h1 {
  font-size: 2rem;
  line-height: 1.25;
  margin: 0 0 0.75rem;
}

h2 {
  margin-top: 2.5rem;
}

.description {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
}
</style>