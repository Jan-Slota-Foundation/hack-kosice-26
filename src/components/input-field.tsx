import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

function InputField({
  label,
  description,
  error,
  className,
  ...inputProps
}: React.ComponentProps<typeof Input> & {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: string
}) {
  return (
    <Field className={className} data-invalid={!!error}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Input aria-invalid={!!error} {...inputProps} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

export { InputField }
