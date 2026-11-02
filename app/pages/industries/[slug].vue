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
  <main v-if="report" class="page">
    <BlogArticle :report="report" />
  </main>
</template>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>