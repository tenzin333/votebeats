"use client"

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Sign Up",
      description: "Create your creator account in seconds with just an email",
    },
    {
      number: "2",
      title: "Explore Music",
      description: "Browse thousands of tracks organized by mood and genre",
    },
    {
      number: "3",
      title: "Build Playlists",
      description: "Curate custom playlists for different stream types",
    },
    {
      number: "4",
      title: "Stream & Enjoy",
      description: "Integrate with your streaming software and start playing",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Get started in four simple steps</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/20 -z-10"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-4 relative z-10">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
