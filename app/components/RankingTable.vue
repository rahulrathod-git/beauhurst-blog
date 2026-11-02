<script setup lang="ts">
defineProps<{
  headers: string[]
  rows: { rank: number; value: number; cells: string[] }[]
  valueKey?: string
}>()
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th v-for="h in headers" :key="h" scope="col" :class="{ highlight: h === valueKey }">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.rank">
          <td v-for="(cell, i) in row.cells" :key="i" :class="{ highlight: headers[i] === valueKey }">{{ cell }}</td>
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
  border-collapse: collapse;
  font-size: 0.9rem;
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

.highlight {
  font-weight: 700;
}
</style>