import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side (respects RLS)
export const supabase = createClient(url, anon)

// Server-side only (bypasses RLS)
export const supabaseAdmin = createClient(url, serviceRole)
