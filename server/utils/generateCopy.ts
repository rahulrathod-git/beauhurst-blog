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
  topShare: string
  top: { name: string; value: string }[]
}

function titleCase(text: string): string {
  return text.replace(/\b\p{L}/gu, c => c.toUpperCase())
}

function startsWithCapital(text: string): boolean {
  const first = text.trim().charAt(0)
  if (!/\p{L}/u.test(first)) return true
  return first === first.toUpperCase()
}

function everySentenceCapitalised(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
  return sentences.every(startsWithCapital)
}

function isBlogCopy(value: unknown): value is BlogCopy {
  const v = value as BlogCopy
  if (!v || typeof v !== 'object') return false
  if (/undefined|NaN/.test(JSON.stringify(v))) return false
  if (typeof v.title !== 'string' || typeof v.metaDescription !== 'string' || typeof v.intro !== 'string') return false
  if (!startsWithCapital(v.title) || !everySentenceCapitalised(v.intro)) return false
  if (!Array.isArray(v.sections) || v.sections.length !== 2) return false

  return v.sections.every(s =>
    typeof s?.heading === 'string'
    && typeof s?.body === 'string'
    && startsWithCapital(s.heading)
    && everySentenceCapitalised(s.body),
  )
}

export function buildFallbackCopy(facts: Facts, valueKey: string): BlogCopy {
  const name = titleCase(facts.datasetName)
  const share = facts.topShare ?? 'not available'
  const [first, ...rest] = facts.top
  const others = rest.map(r => `${r.name} (${r.value})`).join(', ')

  return {
    title: `${name}: ${facts.count} Entries Ranked by ${valueKey}`,
    metaDescription: `Ranking of ${facts.count} entries from ${name} by ${valueKey}, with totals, median and the full table.`,
    intro: `This report ranks ${facts.count} entries from ${name} by ${valueKey}.\n\nThe combined total is ${facts.total} and the median is ${facts.median}. The full ranking is set out below.`,
    sections: [
      {
        heading: 'Leaders',
        body: first
          ? `${first.name} ranks first with ${first.value}.${others ? ` Next come ${others}.` : ''}`
          : 'No leading entries were found in the data.',
      },
      {
        heading: 'How the Values Are Spread',
        body: `The highest value is ${facts.max}, compared with a median of ${facts.median}. The top five hold ${share} of the total.`,
      },
    ],
  }
}

export async function generateCopy(event: any, facts: Facts): Promise<BlogCopy> {
  const config = useRuntimeConfig(event)
  const top = facts.top[0]

  const prompt = `You write an SEO article from a dataset summary. You receive a dataset name, the column the ranking is based on, summary figures, the share of the total held by the top five, and the top five entries.

Capitalisation and grammar:
- Write in normal sentence case. Every sentence starts with a capital letter. Company names and place names keep their own capitals, such as Nevis, Januus.io and London.
- Headings use capitals for each main word, such as "Funding Totals and Median".
- The title starts with a capital letter.
- Use complete sentences with full stops.

Facts and sourcing:
- Use only the figures and names provided. Do not add statistics, market totals, dates, or facts about companies that are not in the input.
- Do not calculate new ratios, multiples, fractions or percentages. Do not write phrases such as "seven times larger", "twice as much" or "a third of".
- Use every figure exactly as given, character for character.
- Do not use "exceed", "more than" or "less than" unless the comparison is strictly true. If two values are equal, say "equal to". If a value is at or above a threshold, say "at least".
- Do not compare figures beyond the order they appear in the ranking.
- You may explain the sector in general terms, without any numbers that are not given.

Style:
- Plain British English for a general reader.
- Short, factual sentences. State the figure, then what it shows about this ranking.
- Do not use these words or phrases: massive, impressive, remarkable, substantial, staggering, extraordinary, standout, sets apart, major success, immense, strong investor confidence, demonstrates, highlights, showcases, vital, game-changing, next big, illustrates, scale of.
- Do not comment on investor sentiment, market health or the future of the sector.

Title:
- Under 70 characters.
- A headline that names the subject and states one key figure from the input, either the total or the highest value.
- It must not look like a file name.

Structure:
- intro: two short paragraphs separated by a blank line. Say what the dataset covers, how many entries it has, and what the ranking is based on.
- sections: exactly 2 objects, each with a specific heading and a body of two paragraphs (60 to 90 words in total), separated by a blank line.
  - Section 1: the combined total and the median, and what the gap between them shows about how the figures are spread.
  - Section 2: the highest entry, ${top ? top.name : 'the first entry'} with ${top ? top.value : 'the top figure'}, then the next four entries in order, and state that the top five hold ${facts.topShare} of the total.
- Do not repeat a figure in more than two places across the article.

Return only JSON with these keys:
- title: string, under 70 characters
- metaDescription: string, under 160 characters
- intro: string
- sections: array of 2 objects, each with heading and body

Input:
Dataset: ${facts.datasetName}
Ranked by: ${facts.valueKey}
Count: ${facts.count}
Total: ${facts.total}
Median: ${facts.median}
Highest: ${facts.max}
Top five share of total: ${facts.topShare}
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
      throw new Error('Gemini returned copy that failed validation')
    }

    return parsed
  } finally {
    clearTimeout(timer)
  }
}