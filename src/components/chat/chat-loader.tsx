import { cn } from '@/lib/utils'
import { BeatLoader } from 'react-spinners'

export default function ChatLoader({ className }: { className?: string }) {
  return (
    <BeatLoader
      className={cn('', className)}
      color="#000"
      size={3}
      speedMultiplier={0.5}
      loading={true}
      cssOverride={{
        display: 'flex',
      }}
    />
  )
}
