<script setup lang="ts">
import Papa from 'papaparse'

const csvText = ref('')
const columns = ref<string[]>([])
const valueKey = ref('')
const result = ref<any>(null)
const error = ref('')
const loading = ref(false)

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  if (!selected) return

  error.value = ''
  result.value = null
  csvText.value = await selected.text()

  const preview = Papa.parse<string[]>(csvText.value, { preview: 1, delimiter: ',' })
  columns.value = preview.data[0] ?? []
  valueKey.value = columns.value.find(c => c.toLowerCase().includes('total')) ?? columns.value[0] ?? ''
}

async function generate() {
  error.value = ''
  loading.value = true
  try {
    result.value = await $fetch('/api/analyse', {
      method: 'POST',
      body: { csv: csvText.value, valueKey: valueKey.value },
    })
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Something went wrong'
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Upload a dataset' })
</script>

<template>
  <main>
    <h1>Upload a dataset</h1>
    <p>Choose a CSV file, pick the column to rank by, then generate.</p>

    <input type="file" accept=".csv" @change="onFile" />

    <div v-if="columns.length" class="controls">
      <label>
        Rank by
        <select v-model="valueKey">
          <option v-for="c in columns" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <button :disabled="loading" @click="generate">
        {{ loading ? 'Analysing...' : 'Generate' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <section v-if="result?.copy">
      <h2>{{ result.copy.title }}</h2>
      <p>{{ result.copy.intro }}</p>
      <ul>
        <li v-for="line in result.copy.insights" :key="line">{{ line }}</li>
      </ul>
    </section>

    <section v-if="result">
      <h2>Results</h2>
      <p>
        Count {{ result.stats.count }}, total {{ result.stats.total }},
        average {{ result.stats.average }}, median {{ result.stats.median }},
        max {{ result.stats.max }}.
      </p>
      <ol>
        <li v-for="row in result.top" :key="row.rank">
          {{ row.name }}: {{ row.value }}
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; }
.controls { display: flex; gap: 1rem; align-items: center; margin: 1rem 0; }
.error { color: #b00020; }
</style>