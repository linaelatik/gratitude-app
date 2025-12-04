import { NextResponse } from "next/server"
import db from "@/lib/db"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("session_user_id")?.value
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = db.prepare("SELECT id, content, created_at FROM entries WHERE user_id = ? ORDER BY created_at DESC").all(userId)
  return NextResponse.json({ entries: rows })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("session_user_id")?.value
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content } = await req.json()
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const id = crypto.randomUUID()
  db.prepare("INSERT INTO entries (id, user_id, content) VALUES (?, ?, ?)").run(id, userId, content.trim())

  const row = db.prepare("SELECT id, content, created_at FROM entries WHERE id = ?").get(id)
  return NextResponse.json({ entry: row })
}