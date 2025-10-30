import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { sendEmail, generateSummaryEmailHTML, generateSummaryEmailText } from "@/lib/email"

export const maxDuration = 60

/**
 * API route to send weekly summaries to subscribed users
 *
 * This would typically be called by a cron job (e.g., Vercel Cron)
 * to automatically send weekly summaries every Sunday evening.
 *
 * Example cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/send-weekly-summary",
 *     "schedule": "0 20 * * 0"
 *   }]
 * }
 */
export async function POST(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all users with weekly summary enabled
    const { data: subscriptions, error: subsError } = await supabase
      .from("email_subscriptions")
      .select("user_id, users(email, display_name)")
      .eq("weekly_summary", true)

    if (subsError) throw subsError

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No subscribed users found" })
    }

    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const results = []

    for (const subscription of subscriptions) {
      try {
        const user = subscription.users as any
        if (!user) continue

        // Fetch user's entries from the past week
        const { data: entries } = await supabase
          .from("entries")
          .select("*")
          .eq("user_id", subscription.user_id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })

        if (!entries || entries.length === 0) {
          results.push({
            userId: subscription.user_id,
            email: user.email,
            status: "skipped",
            reason: "No entries this week",
          })
          continue
        }

        // Generate AI summary
        const entriesText = entries
          .map((entry, index) => {
            const date = new Date(entry.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
            return `${index + 1}. ${date}: ${entry.content}`
          })
          .join("\n\n")

        const prompt = `Create a warm, personalized weekly gratitude summary for ${user.display_name || "the user"}. Based on their ${entries.length} gratitude entries from this week, write 3-4 paragraphs that highlight themes, celebrate their consistency, and offer encouraging insights. Keep it personal and uplifting.

Entries:
${entriesText}`

        const { text: summary } = await generateText({
          model: "openai/gpt-5-mini",
          prompt,
          maxOutputTokens: 800,
          temperature: 0.7,
        })

        // Send email
        const emailHTML = generateSummaryEmailHTML(summary, user.display_name || user.email, entries.length)
        const emailText = generateSummaryEmailText(summary, user.display_name || user.email, entries.length)

        const emailResult = await sendEmail({
          to: user.email,
          subject: `Your Weekly Gratitude Summary - ${entries.length} entries this week`,
          html: emailHTML,
          text: emailText,
        })

        results.push({
          userId: subscription.user_id,
          email: user.email,
          status: emailResult.success ? "sent" : "failed",
          entryCount: entries.length,
          error: emailResult.error,
        })
      } catch (error) {
        results.push({
          userId: subscription.user_id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: "Weekly summaries processed",
      results,
      totalProcessed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    })
  } catch (error) {
    console.error("Error sending weekly summaries:", error)
    return NextResponse.json({ error: "Failed to send weekly summaries" }, { status: 500 })
  }
}
