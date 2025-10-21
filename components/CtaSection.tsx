"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link";

export  function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 p-12 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">Ready to Shape the Soundtrack?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sign in to start upvoting songs and adding music to help creators find their perfect soundtrack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-accent text-primary-foreground gap-2" >
                Sign In Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/login">
              <Button size="lg" variant="outline" className="border-border hover:bg-card bg-transparent">
              Create Account
            </Button>
            </Link>
          
          </div>
        </div>
      </div>
    </section>
  )
}
