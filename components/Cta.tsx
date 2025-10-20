"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
          Ready to Transform Your Streams?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of creators already using SoundStage to elevate their content with the perfect soundtrack.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-primary hover:bg-accent text-primary-foreground gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-card bg-transparent">
            View Pricing
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">No credit card required. Full access for 14 days.</p>
      </div>
    </section>
  )
}
