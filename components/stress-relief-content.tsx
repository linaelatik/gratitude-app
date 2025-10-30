"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
  const [stressorInput, setStressorInput] = useState("") 
  const [reflection, setReflection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReflection = async () => {
    // Validation 
    if (!stressorInput.trim()) {
      setError("Please describe what's stressing you")
      return
    }

    setIsLoading(true)
    setError(null)
    setReflection(null)

    try {
      const response = await fetch("/api/generate-reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          entries,
          stressor: stressorInput //- send stressor
        }),
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
          Tell me what's on your mind, and I'll help you reconnect with gratitude.
        </p>
      </div>

      {/* Stressor Input Form */}
      {!reflection && (
        <Card>
          <CardHeader>
            <CardTitle>What's stressing you right now?</CardTitle>
            <CardDescription>
              Describe what's on your mind, and I'll reflect on your gratitude journey to help provide perspective.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center">
                <p className="mb-4 text-muted-foreground">
                  You don't have any gratitude entries yet. Start journaling to unlock AI reflections!
                </p>
                <Button asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="E.g., 'I'm anxious about my presentation tomorrow' or 'Feeling overwhelmed with work'"
                  value={stressorInput}
                  onChange={(e) => setStressorInput(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button 
                  size="lg" 
                  onClick={generateReflection} 
                  disabled={isLoading || !stressorInput.trim()}
                  className="w-full"
                >
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
            <CardDescription>Based on: "{stressorInput}"</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{reflection}</p>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => {
                setReflection(null)
                setStressorInput("")
              }}>
                Try Another Reflection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Recent Gratitude Moments</h2>
          <p className="text-sm text-muted-foreground">
            The AI will reference these entries when generating your reflection
          </p>
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
