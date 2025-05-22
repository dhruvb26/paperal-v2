import { ChevronRight, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { currentUser } from '@clerk/nextjs/server'
import { ModeToggleDropdownItems } from '@/components/ui/mode-toggle'
import { SignOutButton } from '@/components/user/sign-out-button'

export default async function UserButton() {
  const user = await currentUser()

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="flex items-center justify-between w-full gap-2 hover:cursor-pointer px-2">
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-sm text-muted-foreground">
              {user.emailAddresses[0].emailAddress}
            </span>
          </div>
          <ChevronRight className="size-4" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <ModeToggleDropdownItems />
        <DropdownMenuItem>
          <Settings className="size-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
