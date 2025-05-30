"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample reflections that would normally be generated by AI
const reflections = {
  week: [
    {
      title: "Appreciating Connections",
      content:
        "This week, you expressed gratitude for several meaningful connections in your life. Your entries about phone calls with family and supportive colleagues show how much you value these relationships.",
    },
    {
      title: "Finding Joy in Nature",
      content:
        "Nature was a recurring theme in your gratitude this week. From morning walks to beautiful sunsets, you've been noticing and appreciating the natural world around you. This mindfulness of your environment seems to bring you peace and perspective.",
    },
    {
      title: "Daily Rituals",
      content:
        "Your morning coffee ritual stands out as something that centers you and prepares you for the day ahead. These small moments of mindfulness appear to be important anchors in your daily routine.",
    },
  ],
  month: [
    {
      title: "Growth Mindset",
      content:
        "Over the past month, you've frequently expressed gratitude for overcoming challenges. This reflects a growth mindset and resilience that serves you well in difficult times.",
    },
    {
      title: "Simple Pleasures",
      content:
        "Many of your entries focus on simple comforts: a warm bed, delicious food, and quiet moments. This appreciation for life's basic pleasures is a powerful practice for ongoing contentment.",
    },
    {
      title: "Work Accomplishments",
      content:
        "You've noted several work achievements this month. Your gratitude for these successes shows that you value your professional growth and contributions.",
    },
  ],
  year: [
    {
      title: "Consistent Themes",
      content:
        "Looking at your year in gratitude, certain themes emerge consistently: relationships, nature, personal growth, and daily comforts. These appear to be your core values.",
    },
    {
      title: "Emotional Journey",
      content:
        "Your entries reflect an emotional journey through the year, with gratitude helping you navigate both challenges and celebrations. This practice has clearly been a stabilizing force.",
    },
    {
      title: "Evolving Perspective",
      content:
        "Your early entries compared to recent ones show an evolving perspective. You seem to be noticing more subtle forms of gratitude as your practice deepens.",
    },
  ],
}

export default function Reflections() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-blue-50 to-green-50">
      <Sidebar />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Reflections</h1>

            <Tabs defaultValue="week" className="mb-8">
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="year">This Year</TabsTrigger>
              </TabsList>

              <TabsContent value="week" className="mt-6 space-y-6">
                <p className="text-gray-600">
                  Here are some reflections based on your gratitude entries from the past week.
                </p>

                {reflections.week.map((reflection, index) => (
                  <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                    <CardHeader className="bg-emerald-50 pb-3">
                      <CardTitle className="text-lg text-emerald-800">{reflection.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700">{reflection.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="month" className="mt-6 space-y-6">
                <p className="text-gray-600">
                  Here are some reflections based on your gratitude entries from the past month.
                </p>

                {reflections.month.map((reflection, index) => (
                  <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                    <CardHeader className="bg-blue-50 pb-3">
                      <CardTitle className="text-lg text-blue-800">{reflection.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700">{reflection.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="year" className="mt-6 space-y-6">
                <p className="text-gray-600">
                  Here are some reflections based on your gratitude entries from the past year.
                </p>

                {reflections.year.map((reflection, index) => (
                  <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                    <CardHeader className="bg-amber-50 pb-3">
                      <CardTitle className="text-lg text-amber-800">{reflection.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700">{reflection.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
