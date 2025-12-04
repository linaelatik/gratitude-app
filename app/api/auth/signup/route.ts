import { NextResponse } from "next/server"
import db from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password, display_name } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  try {
    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 10)
    const id = crypto.randomUUID()

    db.prepare(
      "INSERT INTO users (id, email, display_name, password_hash) VALUES (?, ?, ?, ?)"
    ).run(id, email, display_name || null, password_hash)

    // Create default email subscription row
    db.prepare(
      "INSERT INTO email_subscriptions (id, user_id, weekly_summary) VALUES (?, ?, 1)"
    ).run(crypto.randomUUID(), id)

    const res = NextResponse.json({ user: { id, email, display_name: display_name || null } })
    res.cookies.set("session_user_id", id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
    return res
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}