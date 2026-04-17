import { z } from 'zod'

const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Invalid client env:', z.prettifyError(parsed.error))
  throw new Error('Invalid client env — see console for details')
}

export const env = parsed.data
