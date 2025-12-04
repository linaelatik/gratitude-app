"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/flask-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare, Clock, Heart } from "lucide-react"
import Link from "next/link"

interface StressQuery {
  id: string
  stressor: string
  ai_response: string
  created_at: string
}

interface GratitudeEntry {
  id: string
  content: string
  created_at: string
}

export default function StressReliefPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stressor, setStressor] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [relatedEntries, setRelatedEntries] = useState<GratitudeEntry[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<StressQuery[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      loadStressHistory()
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const loadStressHistory = async () => {
    try {
      const historyData = await supabase.getStressReflectionHistory()
      setHistory(historyData.history || [])
    } catch (error) {
      console.error('Error loading stress history:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stressor.trim()) return

    setIsGenerating(true)
    setAiResponse("")
    setRelatedEntries([])

    try {
      const response = await supabase.generateStressReflection(stressor.trim())
      
      setAiResponse(response.ai_response)
      setRelatedEntries(response.related_entries || [])
      setStressor("")
      
      loadStressHistory()
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      setAiResponse("I'm sorry, I'm having trouble generating a response right now. Please try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      hour: "numeric",
      minute: "2-digit"
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">AI Stress Relief</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share what's causing you stress. Our AI will analyze your gratitude patterns 
            and provide personalized perspective to help you feel better.
          </p>
        </div>

        {/* Main Content Row: Input + AI Response */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Stress Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                What's stressing you out?
              </CardTitle>
              <CardDescription>
                Be as specific as possible. The AI will use your past gratitude entries to provide meaningful support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="I'm feeling stressed because..."
                  value={stressor}
                  onChange={(e) => setStressor(e.target.value)}
                  className="min-h-32 resize-none"
                  disabled={isGenerating}
                />
                <Button 
                  type="submit" 
                  disabled={isGenerating || !stressor.trim()}
                  className="w-full"
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isGenerating ? "AI is thinking..." : "Get AI Support"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right: AI Response */}
          {aiResponse ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">AI Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed text-green-900">
                  {aiResponse}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground text-center">
                  Your AI reflection will appear here after you share what's stressing you
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Related Gratitude Entries - Full Width */}
        {relatedEntries.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Here are some moments that might help you remember the good times:
              </CardTitle>
              <CardDescription className="text-blue-700">
                Your past gratitude entries that could provide perspective on your current situation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {relatedEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <p className="text-sm text-gray-800 mb-3 leading-relaxed">{entry.content}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your AI Interaction History
            </CardTitle>
            <CardDescription>
              Review your past AI conversations for patterns and progress. Click any conversation to see full details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full mb-4"
            >
              {showHistory ? "Hide History" : `View History (${history.length} conversations)`}
            </Button>
            
            {showHistory && (
              <div className="space-y-6">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No AI conversations yet. Start by sharing a stressor above.
                  </p>
                ) : (
                  history.map((query, index) => (
                    <div key={query.id} className="border rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">
                            Conversation #{history.length - index}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(query.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        {/* User's Stressor */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            You shared:
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-sm leading-relaxed">
                              {query.stressor}
                            </p>
                          </div>
                        </div>

                        {/* AI Response */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            AI responded:
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-800 text-sm leading-relaxed">
                              {query.ai_response}
                            </p>
                          </div>
                        </div>

                        {/* Related Entries Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-blue-800 mb-1">
                            Gratitude context used:
                          </div>
                          <p className="text-blue-700 text-xs">
                            This AI response was generated using your most recent gratitude entries 
                            to provide personalized perspective based on positive moments you've experienced.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Research Disclaimer */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Research Note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900">
            <p>
              This AI stress relief feature is part of ongoing research into ethical AI applications 
              in mental health. All interactions are anonymized and analyzed to understand how AI 
              can provide supportive, safe mental health assistance.
            </p>
            <p className="mt-2 font-medium">
              Your participation helps improve AI ethics in wellness applications.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}