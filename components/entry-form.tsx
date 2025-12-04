"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/flask-client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface EntryFormProps {
  userId: string
}

export function EntryForm({ userId }: EntryFormProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Add these debug logs
  console.log("userId:", userId)
  console.log("content:", content)
  
  if (!content.trim()) return

  setIsLoading(true)
  setError(null)

  try {
    
    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Auth error:", authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      
      if (!user) {
        throw new Error("No user found - please login")
      }
      
      // First verify the user exists in public.users
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
        
      if (userError || !publicUser) {
        console.error("Public user error:", userError)
        throw new Error("User account not properly set up - please sign out and create a new account")
      }
      
      console.log("Authenticated user:", user.id)
      
      // Use the authenticated user's ID
      const { data, error } = await supabase
        .from("entries")
        .insert({
          content: content.trim(),
          user_id: user.id
        })
        .select()  // This returns the inserted row
    
    // IMPORTANT: Check the error first
    if (error) {
      console.error("Supabase insert error:", error)
      // Supabase errors have code, message, and details
      throw new Error(error.message || error.code || "Database insert failed")
    }
    
    console.log("Successfully inserted:", data)
    setContent("")
    router.refresh()
    
  } catch (err) {
    // Better error handling
    console.error("Full error details:", err)
    
    let errorMessage = "Failed to save entry"
    
    if (err instanceof Error) {
      errorMessage = err.message
    } else if (typeof err === 'object' && err !== null) {
      // Handle Supabase error objects
      errorMessage = (err as any).message || (err as any).error_description || JSON.stringify(err)
    }
    
    setError(errorMessage)
  } finally {
    setIsLoading(false)
  }
}

  return (
    <Card>
      <CardHeader>
        <CardTitle>What are you grateful for today?</CardTitle>
        <CardDescription>Take a moment to reflect on the positive things in your life</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="I'm grateful for..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32 resize-none"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading || !content.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
