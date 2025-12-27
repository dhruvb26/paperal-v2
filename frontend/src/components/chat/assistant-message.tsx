import ChatAvatar from '@/components/chat/chat-avatar'
import { UIMessage } from '@/types/chat'
import { parseMessageContent } from '@/components/chat/message-parser'

export default function AssistantMessage({
  message,
  isStreaming = false,
}: {
  message: UIMessage
  isStreaming?: boolean
}) {
  return (
    <div className="flex flex-row gap-2 items-start max-w-[60%]">
      <ChatAvatar />
      <div className="flex flex-col gap-1">
        <div className="flex flex-row gap-1">
          <div className="py-2 px-3 rounded-xl text-sm font-medium prose max-w-none">
            {parseMessageContent(message.content)}
            {isStreaming && <span className="ml-1 animate-pulse">█</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
