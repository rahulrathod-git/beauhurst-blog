<script setup lang="ts">
import Papa from 'papaparse'

const csvText = ref('')
const fileName = ref('')
const columns = ref<string[]>([])
const valueKey = ref('')
const error = ref('')
const loading = ref(false)

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  if (!selected) return

  error.value = ''
  fileName.value = selected.name
  csvText.value = await selected.text()

  const preview = Papa.parse<string[]>(csvText.value, { preview: 1, delimiter: ',' })
  columns.value = preview.data[0] ?? []
  valueKey.value = columns.value.find(c => c.toLowerCase().includes('total')) ?? columns.value[0] ?? ''
}

async function generate() {
  error.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ slug: string }>('/api/analyse', {
      method: 'POST',
      body: {
        csv: csvText.value,
        valueKey: valueKey.value,
        datasetName: fileName.value.replace(/\.csv$/i, ''),
      },
    })
    await navigateTo(`/industries/${res.slug}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Something went wrong'
    loading.value = false
  }
}

useSeoMeta({ title: 'Upload your dataset' })
</script>

<template>
  <main>
    <h1>Upload your dataset</h1>
    <p>Choose a .csv file, pick the column to rank by, then generate your blog page.</p>

    <input type="file" accept=".csv" @change="onFile" />

    <div v-if="columns.length" class="controls">
      <label>
        Rank by
        <select v-model="valueKey">
          <option v-for="c in columns" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <button :disabled="loading" @click="generate">
        {{ loading ? 'Generating...' : 'Generate blog' }}
      </button>
    </div>

    <p v-if="loading">Writing your blog. This can take up to 45 seconds.</p>
    <p v-if="error" class="error">{{ error }}</p>
  </main>
</template>

<style scoped>
main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, sans-serif; }
.controls { display: flex; gap: 1rem; align-items: center; margin: 1rem 0; flex-wrap: wrap; }
.error { color: #b00020; }
</style>