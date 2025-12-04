import { NextResponse } from "next/server"
import db from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  try {
    const stmt = db.prepare("SELECT id, email, display_name, password_hash FROM users WHERE email = ?")
    const user = stmt.get(email) as any
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.password_hash as string)
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const res = NextResponse.json({ user: { id: user.id, email: user.email, display_name: user.display_name } })
    res.cookies.set("session_user_id", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
    return res
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}