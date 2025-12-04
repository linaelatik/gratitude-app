import { supabase } from '@/lib/flask-client'
import { NextResponse } from "next/server"


export async function POST(req: Request) {
  try {
    const { id, email, display_name } = await req.json()

    if (!id || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (existingUser) {
      // User already exists, return success
      return NextResponse.json({ success: true });
    }

    // Insert the user with service role client (bypasses RLS)
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id,
        email,
        display_name: display_name || email.split("@")[0],
      })

    if (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json(
        { error: `Failed to create user: ${userError.message}` },
        { status: 500 }
      )
    }

    // Create default email subscription
    const { error: subscriptionError } = await supabase
      .from("email_subscriptions")
      .insert({
        user_id: id,
        weekly_summary: true,
      })

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      // Don't fail the request for subscription error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}