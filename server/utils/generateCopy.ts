export interface BlogCopy {
  title: string
  intro: string
  metaDescription: string
  insights: string[]
}

export interface Facts {
  datasetName: string
  count: number
  total: string
  median: string
  max: string
  top: { name: string; value: string }[]
}

function isBlogCopy(value: unknown): value is BlogCopy {
  const v = value as BlogCopy
  return (
    typeof v?.title === 'string' &&
    typeof v?.intro === 'string' &&
    typeof v?.metaDescription === 'string' &&
    Array.isArray(v?.insights) &&
    v.insights.every(i => typeof i === 'string')
  )
}

export async function generateCopy(event: any, facts: Facts): Promise<BlogCopy> {
  const config = useRuntimeConfig(event)

  const prompt = `You write SEO blog copy from statistics.
Use only the figures provided below. Do not invent or estimate any numbers.
Return only JSON with these keys:
- title: string, under 70 characters
- intro: string, two or three sentences
- metaDescription: string, under 160 characters
- insights: array of two or three short strings

Dataset: ${facts.datasetName}
Count: ${facts.count}
Total: ${facts.total}
Median: ${facts.median}
Max: ${facts.max}
Top five: ${JSON.stringify(facts.top)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)

  try {
    const res = await $fetch<any>(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': config.geminiApiKey },
        signal: controller.signal,
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        },
      },
    )

    const text = res?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const parsed = JSON.parse(text)

    if (!isBlogCopy(parsed)) {
      throw new Error('Gemini returned JSON in an unexpected shape')
    }

    return parsed
  } finally {
    clearTimeout(timer)
  }
}