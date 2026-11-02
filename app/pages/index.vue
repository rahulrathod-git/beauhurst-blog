<script setup lang="ts">
useSeoMeta({
  title: 'SEO Blog Generator',
  description: 'Turn any company dataset into an SEO-ready blog page with a ranking table, statistics and written copy.',
  ogTitle: 'SEO Blog Generator',
  ogDescription: 'Turn any company dataset into an SEO-ready blog page with a ranking table, statistics and written copy.',
})
</script>

<template>
  <main>
    <header class="hero">
      <h1>SEO Blog Generator</h1>
      <p>Upload a company dataset as a CSV, pick the column to rank by, and get a published-style blog page with written copy, statistics and a full ranking table.</p>
      <NuxtLink to="/upload" class="button">Create your own blog</NuxtLink>
    </header>

    <section class="example-link">
      <h2>Example</h2>
      <p>See a finished blog built from the UK fintech dataset.</p>
      <NuxtLink to="/industries/fintech-seed-funding-reaches-622-301-270-mvzkg0l9">View the UK fintech blog</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
main {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1rem;
  line-height: 1.6;
}

.hero h1 {
  font-size: 2.25rem;
  margin: 0 0 0.5rem;
}

.hero p {
  max-width: 640px;
  margin: 0 0 1.25rem;
}

.button {
  display: inline-block;
  padding: 0.7rem 1.2rem;
  background: #111111;
  color: #ffffff;
  border-radius: 6px;
  text-decoration: none;
}

.example-link {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #dddddd;
}
</style>