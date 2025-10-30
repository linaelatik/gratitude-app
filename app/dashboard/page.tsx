import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { EntryForm } from "@/components/entry-form"
import { EntriesList } from "@/components/entries-list"
import { StreakCard } from "@/components/streak-card"
import { EntryChart } from "@/components/entry-chart"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Fetch entries for the current user
  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Calculate streak
  const streak = calculateStreak(entries || [])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={profile} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-8 lg:col-span-2">
              <EntryForm userId={user.id} />
              <EntriesList entries={entries || []} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <StreakCard streak={streak} totalEntries={entries?.length || 0} />
              <EntryChart entries={entries || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function calculateStreak(entries: Array<{ created_at: string }>): number {
  if (entries.length === 0) return 0

  const sortedDates = entries
    .map((entry) => new Date(entry.created_at).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Check if there's an entry today or yesterday to start the streak
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0
  }

  let currentDate = new Date()
  for (const dateStr of sortedDates) {
    const entryDate = new Date(dateStr)
    const expectedDate = new Date(currentDate)
    expectedDate.setHours(0, 0, 0, 0)
    entryDate.setHours(0, 0, 0, 0)

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++
      currentDate = new Date(currentDate.getTime() - 86400000)
    } else {
      break
    }
  }

  return streak
}
