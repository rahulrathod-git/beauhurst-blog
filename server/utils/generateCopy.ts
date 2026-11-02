export interface Section {
  heading: string
  body: string
}

export interface BlogCopy {
  title: string
  metaDescription: string
  intro: string
  sections: Section[]
}

export interface Facts {
  datasetName: string
  valueKey: string
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
    typeof v?.metaDescription === 'string' &&
    typeof v?.intro === 'string' &&
    Array.isArray(v?.sections) &&
    v.sections.length >= 2 &&
    v.sections.every(s => typeof s?.heading === 'string' && typeof s?.body === 'string')
  )
}

export function buildFallbackCopy(facts: Facts, valueKey: string): BlogCopy {
  const [first, ...rest] = facts.top
  const others = rest.map(r => `${r.name} (${r.value})`).join(', ')

  return {
    title: `${facts.datasetName}: ${facts.count} Entries Ranked by ${valueKey}`,
    metaDescription: `Ranking of ${facts.count} entries from ${facts.datasetName} by ${valueKey}, with totals, median and the full table.`,
    intro: `This report ranks ${facts.count} entries from ${facts.datasetName} by ${valueKey}.\n\nThe combined total is ${facts.total} and the median is ${facts.median}. The full ranking is set out below.`,
    sections: [
      {
        heading: 'Leaders',
        body: first
          ? `${first.name} ranks first with ${first.value}.${others ? ` Next come ${others}.` : ''}`
          : 'No leading entries were found in the data.',
      },
      {
        heading: 'How the values are spread',
        body: `The highest value is ${facts.max}, compared with a median of ${facts.median}. Comparing the top value with the median shows how unevenly the ${valueKey} figures are spread across the dataset.`,
      },
    ],
  }
}

export async function generateCopy(event: any, facts: Facts): Promise<BlogCopy> {
  const config = useRuntimeConfig(event)
  const top = facts.top[0]

  const prompt = `You write an SEO article from a dataset summary. You receive a dataset name, the column the ranking is based on, summary figures and the top five entries.

Facts and sourcing:
- Use only the figures and names provided. Do not add statistics, market totals, dates, or facts about companies that are not in the input.
- You may explain the sector in general terms, but without any numbers that are not given.

Style:
- Plain British English for a general reader.
- Short, factual sentences. State the figure, then what it means for this ranking.
- Do not use these words or phrases: massive, impressive, remarkable, substantial, staggering, extraordinary, standout, sets apart, major success, immense, strong investor confidence, demonstrates, highlights, showcases, vital, game-changing, next big.
- Do not say what the figures reveal about investor sentiment, market health or the future of the sector.
- The title is a plain headline naming the subject and the ranking. It must not look like a file name.

Structure:
- intro: two short paragraphs separated by a blank line. Say what the dataset covers, how many entries it has, and what the ranking is based on.
- sections: exactly 3 objects. Each has a specific heading and a body of two paragraphs (60 to 90 words in total), separated by a blank line.
  - Section 1 covers the combined total and the median, and what the gap between them says about how the ${facts.valueKey} figures are distributed.
  - Section 2 covers the highest entry, ${top ? top.name : 'the first entry'} with ${top ? top.value : 'the top figure'}, and how the next entries compare with it, using only the top five figures.
  - Section 3 covers the top five as a group and how the highest value compares with the median.
- Do not repeat a figure in more than two places across the article.

Return only JSON with these keys:
- title: string, under 70 characters
- metaDescription: string, under 160 characters
- intro: string
- sections: array of 3 objects with heading and body

Input:
Dataset: ${facts.datasetName}
Ranked by: ${facts.valueKey}
Count: ${facts.count}
Total: ${facts.total}
Median: ${facts.median}
Highest: ${facts.max}
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
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
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