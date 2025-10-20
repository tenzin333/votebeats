"use client"

import { Music } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-8 ">
      <div className="max-w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">VoteBeats</span>
        </div>

        <p className="text-sm text-muted-foreground">&copy; 2025 VoteBeats. All rights reserved.</p>
      </div>
    </footer>
  )
}
