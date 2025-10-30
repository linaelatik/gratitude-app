import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfileSettings } from "@/components/profile-settings"
import { EmailSettings } from "@/components/email-settings"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Fetch email subscription preferences
  const { data: subscription } = await supabase.from("email_subscriptions").select("*").eq("user_id", user.id).single()

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={profile} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <Separator />

            <ProfileSettings profile={profile} userId={user.id} />

            <Separator />

            <EmailSettings subscription={subscription} userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
