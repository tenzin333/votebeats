"use client"

import { ThumbsUp, Play, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const mockSongs = [
  { id: 1, title: "Midnight Dreams", artist: "Luna Echo", votes: 342 },
  { id: 2, title: "Electric Vibes", artist: "Neon Pulse", votes: 287 },
  { id: 3, title: "Ocean Waves", artist: "Coastal Breeze", votes: 156 },
  { id: 4, title: "Urban Rhythm", artist: "City Lights", votes: 98 },
]

export function MusicShowcase() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">See It In Action</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore how the community curates music for creators
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Music List */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Popular Songs</h3>
            <div className="space-y-3">
              {mockSongs.map((song) => (
                <Card
                  key={song.id}
                  className="p-4 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{song.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{song.votes}</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Player Preview */}
          <div className="flex justify-center">
            <Card className="w-full max-w-sm p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="space-y-6">
                {/* Album Art */}
                <div className="aspect-square rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Music className="w-24 h-24 text-white/30" />
                </div>

                {/* Song Info */}
                <div className="text-center">
                  <h4 className="text-xl font-bold text-foreground">Midnight Dreams</h4>
                  <p className="text-muted-foreground">Luna Echo</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1:24</span>
                    <span>4:12</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                    <span className="text-xs">⏮</span>
                  </Button>
                  <Button size="icon" className="rounded-full w-12 h-12">
                    <Play className="w-5 h-5 fill-current" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                    <span className="text-xs">⏭</span>
                  </Button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">🔊</span>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
