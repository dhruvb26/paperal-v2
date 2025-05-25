import UserButton from '@/components/user/user-button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Home } from 'lucide-react'
import CreateDocButton from '@/components/user/create-doc-button'
import UserDocList from '@/components/global/user-doc-list'
import UploadPdfButton from '@/components/user/upload-pdf-button'
import Link from 'next/link'

const items = [
  {
    title: 'Home',
    url: '/home',
    icon: Home,
  },
]

export function AppSidebar() {
  return (
    <>
      <Sidebar className="border-r">
        <SidebarHeader className="flex flex-row items-end justify-between p-4">
          <div className="w-8 h-8 bg-accent rounded-full"></div>
          <div className="flex flex-row items-center gap-2">
            <UploadPdfButton />
            <CreateDocButton />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon className="stroke-2" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <UserDocList />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <UserButton />
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
