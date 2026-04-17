import { InputField } from '@/components/input-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { useAuth } from '@/lib/auth-context'
import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(5),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: Login,
})

function Login() {
  const auth = useAuth()
  const router = useRouter()
  const { redirect } = useSearch({ from: '/login' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = formSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    )
    if (!parsed.success) {
      toast.error('Please enter a valid email and password')
      return
    }

    setIsSubmitting(true)
    const { error } = await auth.signIn(parsed.data)
    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await router.invalidate()
    if (redirect) {
      router.history.push(redirect)
    } else {
      await router.navigate({ to: '/' })
    }
  }

  return (
    <div className="mx-auto max-w-sm p-3">
      <Card>
        <CardContent>
          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Log in</FieldLegend>
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </FieldSet>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
