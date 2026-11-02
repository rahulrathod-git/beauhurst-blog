# Beauhurst SEO Blog Generator

## How it works
1. Upload a CSV on the upload page.
2. The app parses the file
3. The headline stats are calculated in code.
4. Gemini writes the title, intro and sections from those figures.
5. The blog is saved and opens at its own URL, with the full ranking table.

## Live demo
https://beauhurst-blog-3tagecaar-rahul-rathods-projects-e977c5f7.vercel.app/

## Tools
- Nuxt.js
- Vue.js
- TypeScript
- Papa Parse
- Google Gemini API
- Upstash Redis
- Vercel

## Setup
Requires Node.js 22.21 or newer.

```bash
npm install
```

Get your own Gemini API key from [Google AI Studio](https://aistudio.google.com), then create a `.env` file in the project root:

NUXT_GEMINI_API_KEY=your-own-key-here

Replace `your-own-key-here` with your key.

Then run:

```bash
npm install

npm run dev
```

## Limitations
- The app works best on Industry and company style datasets. 
- Gemini's free tier has rate limits, so generation can take up to 45 seconds.

