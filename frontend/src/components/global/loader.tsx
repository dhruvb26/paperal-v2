import { CircleNotchIcon } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils'

export default function Loader({ className }: { className?: string }) {
  return (
    <CircleNotchIcon
      weight="bold"
      className={cn(
        'size-4 text-white mix-blend-difference animate-spin [animation-duration:0.5s]',
        className
      )}
    />
  )
}
