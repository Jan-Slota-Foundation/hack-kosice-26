import { InputField } from '@/components/input-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { useAuth } from '@/lib/auth-context'
import { DEMO_DOCTOR_EMAIL, DEMO_DOCTOR_PASSWORD } from '@/lib/demo-doctor'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'

const formSchema = z.object({
  name: z.string().min(3, 'name must be at least 3 characters'),
  email: z.email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const Route = createFileRoute('/signup')({
  component: Signup,
})

function Signup() {
  const auth = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = formSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    )
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setIsSubmitting(true)
    const { error, needsEmailConfirmation } = await auth.signUp(parsed.data)
    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    if (needsEmailConfirmation) {
      toast.success('Check your email to confirm your account')
      return
    }

    await router.invalidate()
    await router.navigate({ to: '/' })
  }

  const handleDemoSignIn = async () => {
    setIsSubmitting(true)
    const { error } = await auth.signIn({
      email: DEMO_DOCTOR_EMAIL,
      password: DEMO_DOCTOR_PASSWORD,
    })
    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await router.invalidate()
    await router.navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.1),transparent_60%),linear-gradient(to_bottom_right,rgba(99,102,241,0.05),transparent_70%)] p-4">
      <Card className="w-full max-w-sm">
        <CardContent>
          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
          >
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Sign up</FieldLegend>

                <InputField label="Name" name="name" type="text" />
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
                  autoComplete="new-password"
                  required
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleDemoSignIn()
                  }}
                >
                  Continue as demo doctor
                </Button>
              </FieldSet>
            </FieldGroup>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground underline">
              Log in
            </Link>
          </p>
          <p className="text-muted-foreground/40 mt-2 text-center text-xs">
            <a
              href="/atlas_motif_catalog/motif_catalog.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground/70"
            >
              Atlas motif catalog
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
