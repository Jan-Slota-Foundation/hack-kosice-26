import { createClient } from '@supabase/supabase-js'

import { env } from './env'

export const supabase = createClient(
  env.SUPABASE_PROJECT_URL,
  env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
)
