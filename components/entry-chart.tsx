"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface Entry {
  created_at: string
}

interface EntryChartProps {
  entries: Entry[]
}

export function EntryChart({ entries }: EntryChartProps) {
  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toDateString()
  })

  const chartData = last7Days.map((dateStr) => {
    const date = new Date(dateStr)
    const count = entries.filter((entry) => new Date(entry.created_at).toDateString() === dateStr).length

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      entries: count,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Last 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="day"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar dataKey="entries" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
