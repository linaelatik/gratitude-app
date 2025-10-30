import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, BookOpen } from "lucide-react"

interface StreakCardProps {
  streak: number
  totalEntries: number
}

export function StreakCard({ streak, totalEntries }: StreakCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-sm text-muted-foreground">Day streak</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalEntries}</p>
            <p className="text-sm text-muted-foreground">Total entries</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
