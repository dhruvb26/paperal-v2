'use client'
import { useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

export const SignOutButton = () => {
  const { signOut } = useClerk()

  return (
    <>
      <DropdownMenuItem
        className="group hover:cursor-pointer"
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        variant="destructive"
      >
        <span className="group-hover:cursor-pointer flex items-center gap-2">
          <LogOut className="size-4 mr-2 text-destructive" />
          Logout
        </span>
      </DropdownMenuItem>
    </>
  )
}
