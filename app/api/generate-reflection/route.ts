import { generateText } from "ai"
import { NextResponse } from "next/server"
import { supabase } from '@/lib/flask-client'

export const maxDuration = 30

interface Entry {
  id: string
  content: string
  created_at: string
}

export async function POST(req: Request) {
  try {
    const { entries, stressor }: { entries: Entry[]; stressor: string } = await req.json()

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries provided" }, { status: 400 })
    }

    if (!stressor || !stressor.trim()) {
      return NextResponse.json({ error: "Stressor description required" }, { status: 400 })
    }

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // SAFETY CHECK: Check the stressor text for crisis content
    const safetyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/safety-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        entry: stressor.trim(),
        checkType: 'reflection'
      })
    })

    const safetyResult = await safetyResponse.json()

    // If crisis detected, return crisis flag instead of generating reflection
    if (safetyResult.flagged) {
      console.log(`Crisis ${safetyResult.category} detected in reflection - not generating AI response`)
      
      // DO NOT log this to database - privacy protection
      return NextResponse.json({
        isCrisis: true,
        category: safetyResult.category,
        severity: safetyResult.severity,
      })
    }

    // Format entries for the prompt
    const entriesText = entries
      .map((entry, index) => {
        const date = new Date(entry.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        return `${index + 1}. ${date}: ${entry.content}`
      })
      .join("\n\n")

    const prompt = `You are a compassionate AI assistant helping someone who is feeling stressed.

CRITICAL SAFETY INSTRUCTION: If at any point in analyzing this content you detect disclosure of abuse, violence, suicidal thoughts, self-harm, or severe crisis, STOP and respond ONLY with: "CRISIS_DETECTED:[category]" where category is suicide, self_harm, abuse, or psychosis. Do NOT provide comfort or reflection for crisis situations.

Current stressor: "${stressor}"

Based on their recent gratitude journal entries below, provide a warm, encouraging reflection that:

1. Acknowledges their current stress and validates their feelings
2. Gently reminds them of relevant positive moments they've documented
3. Helps them see connections between their stressor and their gratitude practice
4. Offers perspective without dismissing their concerns
5. Keeps the tone warm, personal, and genuinely supportive (not toxic positivity)

Here are their recent gratitude entries:

${entriesText}

Write a thoughtful, personalized reflection (2-3 paragraphs) that acknowledges their stressor while helping them reconnect with gratitude.`

    const { text } = await generateText({
      model: "openai:gpt-4o-mini",
      prompt,
      maxTokens: 500,
      temperature: 0.8,
    })

    // SAFETY CHECK: Check AI's response for crisis detection
    if (text.includes("CRISIS_DETECTED:")) {
      const detectedCategory = text.split(":")[1]?.trim() || "other_crisis"
      
      console.log(`Crisis ${detectedCategory} detected in AI reflection - not returning response`)
      
      // DO NOT log crisis content
      return NextResponse.json({
        isCrisis: true,
        category: detectedCategory,
        severity: "high",
      })
    }

    // SAFE: Log this interaction to database for research
    const entryIds = entries.map(e => e.id)
    
    await supabase.from("stress_queries").insert({
      user_id: user.id,
      stressor_text: stressor,
      retrieved_entry_ids: entryIds,
      ai_response: text,
    })

    return NextResponse.json({ 
      isCrisis: false,
      reflection: text 
    })
    
  } catch (error) {
    console.error("Error generating reflection:", error)
    return NextResponse.json({ error: "Failed to generate reflection" }, { status: 500 })
  }
}
