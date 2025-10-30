import { generateText } from "ai"
import { NextResponse } from "next/server"

export const maxDuration = 30

interface Entry {
  content: string
  created_at: string
}

export async function POST(req: Request) {
  try {
    const { entries }: { entries: Entry[] } = await req.json()

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries provided" }, { status: 400 })
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

    const prompt = `You are a compassionate AI assistant helping someone who is feeling stressed. Based on their recent gratitude journal entries, provide a warm, encouraging reflection that:

1. Acknowledges their feelings and validates their stress
2. Reminds them of the positive moments they've documented
3. Highlights patterns or themes in their gratitude
4. Offers gentle perspective and encouragement
5. Keeps the tone warm, personal, and uplifting

Here are their recent gratitude entries:

${entriesText}

Write a thoughtful, personalized reflection (2-3 paragraphs) that helps them reconnect with gratitude during this stressful moment.`

    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      prompt,
      maxOutputTokens: 500,
      temperature: 0.8,
    })

    return NextResponse.json({ reflection: text })
  } catch (error) {
    console.error("Error generating reflection:", error)
    return NextResponse.json({ error: "Failed to generate reflection" }, { status: 500 })
  }
}
