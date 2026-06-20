import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lesson = {
  id: string
  name: string
  created_at: string
}

export type Character = {
  id: string
  hanzi: string
  pinyin: string
  english: string
  indonesian: string
  lesson_id: string
  created_at: string
}
