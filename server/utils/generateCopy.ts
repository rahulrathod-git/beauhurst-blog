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
  columns: string
  valueKey: string
  hasTotal: boolean
  count: number
  total: string
  median: string
  max: string
  top: { name: string; value: string }[]
  sample: string[]
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

export function buildFallbackCopy(facts: Facts): BlogCopy {
  const name = titleCase(facts.datasetName)
  const [first, ...rest] = facts.top
  const others = rest.map(r => `${r.name} (${r.value})`).join(', ')

  const spread = facts.hasTotal
    ? `The combined total is ${facts.total} and the median is ${facts.median}.`
    : `The median is ${facts.median} and the highest value is ${facts.max}.`

  return {
    title: `${name}: ${facts.count} Entries`,
    metaDescription: `An overview of ${facts.count} entries from ${name}, with headline figures and the full table.`,
    intro: `This article covers ${facts.count} entries from ${name}.\n\n${spread}`,
    sections: [
      {
        heading: 'Leaders',
        body: first
          ? `${first.name} has the highest value, ${first.value}.${others ? ` Next come ${others}.` : ''}`
          : 'No leading entries were found in the data.',
      },
      {
        heading: 'How the Values Are Spread',
        body: spread,
      },
    ],
  }
}

export async function generateCopy(event: any, facts: Facts): Promise<BlogCopy> {
  const config = useRuntimeConfig(event)
  const top = facts.top[0]

  const prompt = `You write an SEO article about a dataset. You receive the dataset name, its column names, a few sample rows, and summary figures for one column.

Work out what the dataset is about from the column names and sample rows.

The intro is two short paragraphs separated by a blank line.
- The first paragraph says what the dataset covers and how many entries it has.
- The second paragraph says what the figures suggest about this sector or topic, in general terms. Use only the names and figures in the input. Do not invent market data, dates or trends.

Capitalisation and grammar:
- Write in normal sentence case. Every sentence starts with a capital letter. Names of companies, places, products and models keep their own capitals.
- Headings use capitals for each main word, such as "Funding Totals and Median".
- The title starts with a capital letter and reads as a headline. It must not look like a file name.
- Use complete sentences with full stops.

Facts and sourcing:
- Use only the figures, names and facts in the input.
- Use each figure exactly as given.
- If Has total is false, do not mention a total. Describe the median and the highest value instead.
- Do not calculate new ratios, multiples, fractions or percentages.
- Do not use "exceed", "more than" or "less than" unless the comparison is strictly true.

Style:
- Plain British English for a general reader, like a magazine article.
- Short, factual sentences.
- Do not use these words or phrases: massive, impressive, remarkable, substantial, staggering, extraordinary, standout, sets apart, major success, immense, strong investor confidence, demonstrates, highlights, showcases, vital, game-changing, next big, illustrates, scale of.
- Do not write about the method, the file, the CSV, or how the article was generated.

Title:
- Under 70 characters.
- Names the subject and one key figure from the input.

Structure:
- intro: as described above.
- sections: exactly 2 objects, each with a specific heading and a body of two paragraphs (60 to 90 words in total), separated by a blank line.
  - Section 1: the spread of ${facts.valueKey}. If Has total is true, cover the total and the median. If false, cover the median and the highest value.
  - Section 2: the highest entries in ${facts.valueKey}: ${top ? top.name : 'the first entry'} with ${top ? top.value : 'the top figure'}, then the next four entries in order.
- Do not repeat a figure in more than two places across the article.

Return only JSON with these keys:
- title: string, under 70 characters
- metaDescription: string, under 160 characters
- intro: string
- sections: array of 2 objects, each with heading and body

Input:
Dataset: ${facts.datasetName}
Columns: ${facts.columns}
Headline column: ${facts.valueKey}
Has total: ${facts.hasTotal}
Count: ${facts.count}
Total: ${facts.total}
Median: ${facts.median}
Highest: ${facts.max}
Top entries: ${JSON.stringify(facts.top)}
Sample rows: ${JSON.stringify(facts.sample)}`

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