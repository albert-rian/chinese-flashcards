import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const hanzi = request.nextUrl.searchParams.get('hanzi') || ''
  if (!hanzi) return NextResponse.json({ error: 'missing hanzi' }, { status: 400 })

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(hanzi)}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    })
    if (!res.ok) return NextResponse.json({ error: 'upstream failed' }, { status: 502 })

    const buffer = await res.arrayBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
