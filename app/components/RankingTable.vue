<script setup lang="ts">
defineProps<{
  headers: string[]
  rows: { rank: number; value: number; cells: string[] }[]
  caption?: string
}>()
</script>

<template>
  <div class="table-wrap">
    <table>
      <caption v-if="caption">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-for="h in headers" :key="h" scope="col">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.rank">
          <td v-for="(cell, i) in row.cells" :key="i">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 0.9rem;
}

caption {
  text-align: left;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #444444;
}

th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid #dddddd;
  vertical-align: top;
}

th {
  font-weight: 600;
}
</style>