import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Prompt {
  id: string
  title: string
  content: string
  content_en?: string
  language: string
  tags: string[]
  parameters: any
  metadata: any
  created_at: string
  updated_at: string
  user_id?: string
}

export interface Character {
  id: string
  name: string
  description: string
  appearance: any
  personality: any
  created_at: string
  updated_at: string
}

// CRUD operations for prompts
export const promptsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('prompts')
      .insert([prompt])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Prompt>) {
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}