"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/flask-client"
import { DashboardHeader } from "@/components/dashboard-header"
import { EntryForm } from "@/components/entry-form"
import { EntriesList } from "@/components/entries-list"
import { StreakCard } from "@/components/streak-card"
import { EntryChart } from "@/components/entry-chart"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      // Load entries here later
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const streak = 0

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={user} />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <EntryForm userId={user.id} />
              <EntriesList entries={entries} />
            </div>
            <div className="space-y-6">
              <StreakCard streak={streak} totalEntries={entries.length} />
              <EntryChart entries={entries} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}