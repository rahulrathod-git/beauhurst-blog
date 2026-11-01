export default defineEventHandler(async (event) => {
  return await generateCopy(event, {
    datasetName: 'Top 100 UK Fintech Companies by Funding Raised',
    count: 100,
    total: 622301270,
    median: 4146786,
    max: 30314247,
    top: [
      { name: 'Nevis', value: 30314247 },
      { name: 'Januus.io', value: 27949436 },
      { name: 'Adfin', value: 24222973 },
    ],
  })
})