"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/flask-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare, Clock } from "lucide-react"
import Link from "next/link"

interface StressQuery {
  id: string
  stressor: string
  ai_response: string
  created_at: string
}

export default function StressReliefPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stressor, setStressor] = useState("")
  const [aiResponse, setAiResponse] = useState("")
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

    try {
      // Generate AI response based on stressor and gratitude context
      const response = await supabase.generateStressReflection(stressor.trim())
      
      setAiResponse(response.ai_response)
      setStressor("")
      
      // Refresh history to show the new interaction
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* AI Stress Relief Interface */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-3">AI Stress Relief</h1>
              <p className="text-muted-foreground">
                Share what's causing you stress. Our AI will analyze your gratitude patterns 
                and provide personalized perspective to help you feel better.
              </p>
            </div>

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

            {/* AI Response */}
            {aiResponse && (
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
            )}
          </div>

          {/* History & Research Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Your AI Interaction History
                </CardTitle>
                <CardDescription>
                  Review your past AI conversations for patterns and progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full"
                >
                  {showHistory ? "Hide History" : `View History (${history.length} conversations)`}
                </Button>
                
                {showHistory && (
                  <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No AI conversations yet. Start by sharing a stressor above.
                      </p>
                    ) : (
                      history.map((query) => (
                        <div key={query.id} className="border rounded-lg p-3 space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(query.created_at)}
                          </div>
                          <div className="text-sm">
                            <strong>You shared:</strong> {query.stressor}
                          </div>
                          <div className="text-sm text-green-700">
                            <strong>AI responded:</strong> {query.ai_response.substring(0, 100)}...
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thesis Research Info */}
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
      </div>
    </div>
  )
}