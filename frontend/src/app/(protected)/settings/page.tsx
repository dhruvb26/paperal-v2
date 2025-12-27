'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const [enabled, setEnabled] = useState<boolean>(true)

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )ai_suggestions=([^;]*)/)
    setEnabled(match ? match[1] === 'true' : true)
  }, [])

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    document.cookie = `ai_suggestions=${checked}; path=/; max-age=${60 * 60 * 24 * 365}`
  }

  return (
    <main className="max-w-lg py-16 px-4">
      <div className="flex flex-col px-6">
        <h1 className="text-base font-medium">Settings</h1>
      </div>
      <div className="flex flex-row items-center justify-between p-6">
        <div>
          <Label className="text-sm">AI Suggestions</Label>
          <div className="text-xs text-muted-foreground">
            Enable or disable AI-powered writing suggestions
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>
      </div>
    </main>
  )
}
