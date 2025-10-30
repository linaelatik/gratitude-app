import { generateText } from "ai"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { userId, startDate, endDate } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch entries for the date range
    let query = supabase.from("entries").select("*").eq("user_id", userId).order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data: entries, error } = await query

    if (error) {
      throw error
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries found for this period" }, { status: 404 })
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

    const prompt = `You are a thoughtful AI assistant creating a weekly gratitude summary. Based on the user's gratitude journal entries from the past week, create a warm, insightful summary that:

1. Highlights key themes and patterns in their gratitude
2. Celebrates their consistency and growth
3. Identifies meaningful moments or recurring sources of joy
4. Offers encouraging observations about their mindset
5. Keeps the tone personal, warm, and uplifting

Here are their gratitude entries from this week:

${entriesText}

Write a personalized weekly summary (3-4 paragraphs) that helps them reflect on their gratitude journey this week. Include:
- A warm opening acknowledging their commitment
- Key themes or patterns you noticed
- Specific highlights from their entries
- An encouraging closing thought

Format the summary in a way that would work well in an email.`

    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      prompt,
      maxOutputTokens: 800,
      temperature: 0.7,
    })

    return NextResponse.json({
      summary: text,
      entryCount: entries.length,
      dateRange: {
        start: startDate || entries[entries.length - 1].created_at,
        end: endDate || entries[0].created_at,
      },
    })
  } catch (error) {
    console.error("Error generating summary:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
