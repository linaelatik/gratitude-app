import { NextResponse } from "next/server"
import db from "@/lib/db"
import { cookies } from "next/headers"

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("session_user_id")?.value
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = params
  const row = db.prepare("SELECT user_id FROM entries WHERE id = ?").get(id) as any
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  db.prepare("DELETE FROM entries WHERE id = ?").run(id)
  return NextResponse.json({ ok: true })
}