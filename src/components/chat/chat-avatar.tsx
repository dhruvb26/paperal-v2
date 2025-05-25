import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ChatAvatar() {
  return (
    <Avatar>
      <AvatarImage src={'/icons/icon.png'} />
      <AvatarFallback>CA</AvatarFallback>
    </Avatar>
  )
}
