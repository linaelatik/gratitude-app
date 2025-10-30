"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface EmailSettingsProps {
  subscription: {
    weekly_summary: boolean
  } | null
  userId: string
}

export function EmailSettings({ subscription, userId }: EmailSettingsProps) {
  const [weeklySummary, setWeeklySummary] = useState(subscription?.weekly_summary ?? true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    setWeeklySummary(checked)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("email_subscriptions")
        .update({ weekly_summary: checked })
        .eq("user_id", userId)

      if (error) throw error

      router.refresh()
    } catch (err) {
      console.error("Failed to update email preferences:", err)
      // Revert on error
      setWeeklySummary(!checked)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>Manage your email notification settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="weekly-summary" className="text-base">
              Weekly Summary
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive a weekly email with AI-generated insights about your gratitude journey
            </p>
          </div>
          <Switch id="weekly-summary" checked={weeklySummary} onCheckedChange={handleToggle} disabled={isLoading} />
        </div>
      </CardContent>
    </Card>
  )
}
