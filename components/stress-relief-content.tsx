"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Heart, Loader2 } from "lucide-react"

interface Entry {
  id: string
  content: string
  created_at: string
}

interface StressReliefContentProps {
  entries: Entry[]
}

export function StressReliefContent({ entries }: StressReliefContentProps) {
  const [reflection, setReflection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReflection = async () => {
    setIsLoading(true)
    setError(null)
    setReflection(null)

    try {
      const response = await fetch("/api/generate-reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate reflection")
      }

      const data = await response.json()
      setReflection(data.reflection)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Feeling Stressed?</h1>
        <p className="text-balance text-lg text-muted-foreground">
          Take a moment to reflect on the positive things in your life. Let AI remind you of your gratitude journey.
        </p>
      </div>

      {/* Generate Reflection Button */}
      {!reflection && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {entries.length === 0 ? (
              <div className="text-center">
                <p className="mb-4 text-muted-foreground">
                  You don&apos;t have any gratitude entries yet. Start journaling to unlock AI reflections!
                </p>
                <Button asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              </div>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Click below to generate a personalized reflection based on your recent gratitude entries.
                </p>
                <Button size="lg" onClick={generateReflection} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating reflection...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate AI Reflection
                    </>
                  )}
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Reflection */}
      {reflection && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Your AI Reflection</CardTitle>
            </div>
            <CardDescription>Based on your recent gratitude entries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{reflection}</p>
            <div className="mt-6 flex gap-2">
              <Button onClick={generateReflection} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate New Reflection
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setReflection(null)}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Recent Gratitude Moments</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    {formatDate(entry.created_at)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm leading-relaxed">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
