/**
 * Email utility functions for sending gratitude summaries
 *
 * Note: This is a placeholder implementation. These are the next steps for me if this was implemented:
 * 1. Add an email service integration (Resend, SendGrid, etc.)
 * 2. Add the required API keys to environment variables
 * 3. Implement the actual email sending logic
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement actual email sending
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Gratitude <noreply@yourdomain.com>',
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  // })

  console.log("[Email] Would send email:", {
    to: options.to,
    subject: options.subject,
    preview: options.text.substring(0, 100) + "...",
  })

  return { success: true }
}

export function generateSummaryEmailHTML(summary: string, userName: string, entryCount: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Gratitude Summary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header h1 {
      color: #111827;
      font-size: 24px;
      margin: 0 0 8px 0;
    }
    .header p {
      color: #6b7280;
      margin: 0;
    }
    .content {
      color: #374151;
      white-space: pre-wrap;
      margin-bottom: 32px;
    }
    .stats {
      background-color: #f3f4f6;
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .stats p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .stats strong {
      color: #111827;
      font-size: 24px;
      display: block;
      margin-bottom: 4px;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      background-color: #111827;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Weekly Gratitude Summary</h1>
      <p>Hello ${userName}!</p>
    </div>
    
    <div class="stats">
      <strong>${entryCount}</strong>
      <p>gratitude entries this week</p>
    </div>
    
    <div class="content">${summary}</div>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="button">
        Continue Your Journey
      </a>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you're subscribed to weekly gratitude summaries.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings" style="color: #6b7280;">Manage your email preferences</a></p>
    </div>
  </div>
</body>
</html>
  `
}

export function generateSummaryEmailText(summary: string, userName: string, entryCount: number): string {
  return `
Your Weekly Gratitude Summary

Hello ${userName}!

You wrote ${entryCount} gratitude entries this week.

${summary}

Continue your journey: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard

---
You're receiving this because you're subscribed to weekly gratitude summaries.
Manage your email preferences: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings
  `.trim()
}
