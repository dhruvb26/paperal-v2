import ChatAvatar from '@/components/chat/chat-avatar'
import ChatLoader from '@/components/chat/chat-loader'

export default function AssistantLoader() {
  return (
    <div className="flex justify-start">
      <div className="flex flex-row gap-2 items-start">
        <ChatAvatar />
        <div className="flex flex-col gap-1">
          <div className="flex flex-row gap-1">
            <div className="py-2 px-3 rounded-xl text-sm font-medium">
              <ChatLoader />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
