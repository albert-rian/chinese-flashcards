import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET(request: NextRequest) {
  const hanzi = request.nextUrl.searchParams.get('hanzi') || ''
  const english = request.nextUrl.searchParams.get('english') || ''
  const pinyin = request.nextUrl.searchParams.get('pinyin') || ''

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'no_key' }, { status: 503 })
  }

  const client = new Anthropic()

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Generate exactly 2 very simple Chinese sentences for an elementary learner. Use the word "${hanzi}" (${pinyin}, meaning: ${english}).

Rules:
- HSK 1–2 vocabulary only (extremely basic words)
- Each sentence must be 5–10 characters long
- Must include "${hanzi}" in each sentence
- Return ONLY valid JSON — no markdown, no code block, no extra text

Required format:
{"sentences":[{"chinese":"...","pinyin":"...","english":"...","indonesian":"..."},{"chinese":"...","pinyin":"...","english":"...","indonesian":"..."}]}`
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
