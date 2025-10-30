import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Sparkles, TrendingUp, Mail } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Gratitude</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Cultivate gratitude, one day at a time
          </h1>
          <p className="text-pretty text-xl text-muted-foreground">
            Transform your mindset with daily gratitude journaling. Track your progress, reflect on positive moments,
            and find peace during stressful times.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Start your journey</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything you need for a gratitude practice</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Daily Journaling</h3>
                  <p className="text-muted-foreground">
                    Write down what you&apos;re grateful for each day. Build a consistent practice that transforms your
                    mindset.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Track Your Streak</h3>
                  <p className="text-muted-foreground">
                    Stay motivated with streak tracking. See your progress and celebrate consistency in your gratitude
                    journey.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">AI Reflections</h3>
                  <p className="text-muted-foreground">
                    Feeling stressed? Get AI-powered reflections based on your past entries to remind you of positive
                    moments.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Weekly Summaries</h3>
                  <p className="text-muted-foreground">
                    Receive weekly email summaries with AI-generated insights about your gratitude patterns and growth.
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Private & Secure</h3>
                  <p className="text-muted-foreground">
                    Your gratitude entries are private and secure. Only you can access your journal, giving you a safe
                    space for reflection.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-balance text-4xl font-bold">Ready to start your gratitude journey?</h2>
            <p className="text-pretty text-lg text-muted-foreground">
              Join thousands of people who are transforming their lives through daily gratitude practice.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Get started for free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Gratitude. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
