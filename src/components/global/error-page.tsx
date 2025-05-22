import { SerializableError } from '@/utils/server-action'

export default function ErrorPage({ error }: { error: SerializableError }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  )
}
