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
  onEntryCreated: () => void
}

export function EntryForm({ userId, onEntryCreated }: EntryFormProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Saving...")
  const [error, setError] = useState<string | null>(null)
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  const [crisisCategory, setCrisisCategory] = useState("none")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    setIsLoading(true)
    setError(null)
    setLoadingMessage("Checking entry...")

    try {
      // Flask backend will do the safety check and return crisis flag if needed
      const response = await supabase.createEntry(content.trim())
      
      // Check if Flask returned crisis flag
      if (response.isCrisis) {
        setCrisisCategory(response.category)
        setShowCrisisAlert(true)
        setContent('') // Clear the entry
        setIsLoading(false)
        return
      }
      
      // Safe - entry was saved successfully
      setContent("")
      onEntryCreated() // Refresh the entries list
      
    } catch (err) {
      console.error("Entry creation error:", err)
      setError(err instanceof Error ? err.message : "Failed to save entry")
    } finally {
      setIsLoading(false)
    }
  }

  // Crisis Alert Modal Component
  const CrisisAlertModal = () => {
    const getResources = () => {
      switch(crisisCategory) {
        case 'abuse':
          return {
            title: "You Deserve Safety and Support",
            message: "It sounds like you may be experiencing abuse. This is serious, and you deserve help. Please reach out to these specialized resources:",
            resources: [
              {
                name: "National Domestic Violence Hotline",
                contact: "Call 1-800-799-7233 or text START to 88788",
                description: "24/7 support, safety planning, and local resources"
              },
              {
                name: "RAINN Sexual Assault Hotline",
                contact: "Call 1-800-656-4673",
                description: "24/7 confidential support for sexual violence survivors"
              },
              {
                name: "Emergency",
                contact: "Call 911",
                description: "If you are in immediate danger"
              }
            ]
          }
        
        case 'suicide':
        case 'self_harm':
          return {
            title: "We're Here for You",
            message: "It sounds like you might be going through a really difficult time. Please reach out for immediate support:",
            resources: [
              {
                name: "988 Suicide & Crisis Lifeline",
                contact: "Call or text 988",
                description: "24/7, free, confidential support"
              },
              {
                name: "Crisis Text Line",
                contact: "Text HOME to 741741",
                description: "24/7 text-based crisis support"
              },
              {
                name: "Emergency",
                contact: "Call 911 or go to nearest ER",
                description: "If you are in immediate danger"
              }
            ]
          }
        
        default:
          return {
            title: "Please Reach Out for Support",
            message: "It sounds like you need professional support right now. These resources can help:",
            resources: [
              {
                name: "Crisis Hotline",
                contact: "Call 988 or text HOME to 741741",
                description: "24/7 support for any crisis"
              },
              {
                name: "Emergency",
                contact: "Call 911",
                description: "If you are in immediate danger"
              }
            ]
          }
      }
    }

    const { title, message, resources } = getResources()

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {title}
          </h2>
          
          <p className="mb-6 text-gray-700">
            {message}
          </p>
          
          <div className="space-y-4 mb-6">
            {resources.map((resource, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded">
                <p className="font-semibold text-gray-800">{resource.name}</p>
                <p className="text-blue-600 font-medium">{resource.contact}</p>
                <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> This app cannot provide the professional support you need right now. 
              Please reach out to one of these services - they are trained to help.
            </p>
          </div>
          
          <button
            onClick={() => {
              setShowCrisisAlert(false)
              setCrisisCategory('none')
              setContent('') // Clear the entry
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {showCrisisAlert && <CrisisAlertModal />}
      
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
              {isLoading ? loadingMessage : "Save Entry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}