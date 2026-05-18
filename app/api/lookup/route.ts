import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

export async function GET(request: NextRequest) {
  const hanzi = request.nextUrl.searchParams.get('hanzi')

  if (!hanzi) {
    return NextResponse.json({ error: 'Missing hanzi parameter' }, { status: 400 })
  }

  // Get pinyin using pinyin-pro
  const pinyinResult = pinyin(hanzi, { toneType: 'symbol', separator: ' ' })

  // Fetch English and Indonesian translations in parallel
  const [englishRes, indonesianRes] = await Promise.all([
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(hanzi)}&langpair=zh|en`),
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(hanzi)}&langpair=zh|id`),
  ])

  const englishData = await englishRes.json()
  const indonesianData = await indonesianRes.json()

  const english = englishData?.responseData?.translatedText || 'Translation unavailable'
  const indonesian = indonesianData?.responseData?.translatedText || 'Terjemahan tidak tersedia'

  return NextResponse.json({
    hanzi,
    pinyin: pinyinResult,
    english,
    indonesian,
  })
}
