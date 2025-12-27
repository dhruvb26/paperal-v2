import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ClerkProvider } from '@clerk/nextjs'
import '@/styles/globals.css'
import {
  CircleCheck,
  CircleEllipsis,
  CircleSlash,
  Info,
  ShieldAlert,
} from 'lucide-react'
import { extractRouterConfig } from 'uploadthing/server'
import { ourFileRouter } from '@/app/api/uploadthing/core'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Paperal',
  description: '',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider signInForceRedirectUrl="/home">
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
            {children}
            <Toaster
              icons={{
                success: <CircleCheck className="w-4 h-4 text-success" />,
                info: <Info className="w-4 h-4 text-blue-500" />,
                warning: <ShieldAlert className="w-4 h-4 text-yellow-500" />,
                error: <CircleSlash className="w-4 h-4 text-destructive" />,
                loading: (
                  <CircleEllipsis className="w-4 h-4 text-muted-foreground" />
                ),
              }}
            />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
