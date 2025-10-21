"use client"

import { ThumbsUp, Users, Music } from "lucide-react"

const features = [
  {
    icon: ThumbsUp,
    title: "Real-Time Voting",
    description: "Upvote or downvote songs as they play. The community decides what's next.",
  },
  {
    icon: Users,
    title: "Collaborative Queue",
    description: "Add songs to the shared queue and watch the playlist evolve together.",
  },
  {
    icon: Music,
    title: "Live Streaming",
    description: "Stream YouTube music seamlessly with instant playback and smooth transitions.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">
            Music Democracy in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features for collaborative listening
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="p-6 rounded-xl border border-border bg-background hover:bg-card/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}