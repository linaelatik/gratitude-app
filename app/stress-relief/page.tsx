import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { StressReliefContent } from "@/components/stress-relief-content"

export default async function StressReliefPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Fetch recent entries (last 10)
  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={profile} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <StressReliefContent entries={entries || []} />
        </div>
      </main>
    </div>
  )
}
