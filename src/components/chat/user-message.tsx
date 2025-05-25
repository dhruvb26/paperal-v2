import { UIMessage } from '@/types/chat'

export default function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="py-2 px-3 rounded-lg max-w-xs bg-muted font-medium text-muted-foreground text-sm whitespace-pre-wrap">
      {message.content}
    </div>
  )
}
