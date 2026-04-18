import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const GRADIENT_CLASS =
  'bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.1),transparent_60%),linear-gradient(to_bottom_right,rgba(99,102,241,0.05),transparent_70%)]'

function GradientCard({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card bg-card text-card-foreground ring-foreground/10 flex flex-col gap-4 overflow-hidden rounded-lg py-4 text-xs/relaxed ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg',
        GRADIENT_CLASS,
        className,
      )}
      {...props}
    />
  )
}

export {
  GradientCard,
  CardHeader as GradientCardHeader,
  CardTitle as GradientCardTitle,
  CardDescription as GradientCardDescription,
  CardAction as GradientCardAction,
  CardContent as GradientCardContent,
  CardFooter as GradientCardFooter,
}
