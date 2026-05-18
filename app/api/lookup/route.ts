import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

export async function GET(request: NextRequest) {
  const hanzi = request.nextUrl.searchParams.get('hanzi')

  if (!hanzi) {
    return NextResponse.json({ error: 'Missing hanzi parameter' }, { status: 400 })
  }

  // Get pinyin using pinyin-pro
  const pinyinResult = pinyin(hanzi, { toneType: 'symbol', separator: ' ' })

  async function googleTranslate(text: string, target: string): Promise<string> {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
    )
    const data = await res.json()
    return data?.[0]?.[0]?.[0] || ''
  }

  // Fetch English and Indonesian translations in parallel
  const [english, indonesian] = await Promise.all([
    googleTranslate(hanzi, 'en'),
    googleTranslate(hanzi, 'id'),
  ])

  return NextResponse.json({
    hanzi,
    pinyin: pinyinResult,
    english,
    indonesian,
  })
}
