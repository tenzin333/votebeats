"use client"

import Image from "next/image"

export function Showcase() {
  const showcaseItems = [
    {
      title: "Gaming Streams",
      description: "High-energy tracks perfect for competitive gaming",
      image: "/gaming-stream-setup-with-colorful-rgb-lighting.jpg",
    },
    {
      title: "Creative Sessions",
      description: "Ambient and lo-fi beats for focused work",
      image: "/creative-workspace-with-music-production-setup.jpg",
    },
    {
      title: "Just Chatting",
      description: "Chill vibes for casual hangouts with your community",
      image: "/cozy-streaming-setup-with-warm-lighting.jpg",
    },
    {
      title: "Music Showcases",
      description: "Discover emerging artists and new releases",
      image: "/music-festival-stage-with-colorful-lights.jpg",
    },
  ]

  return (
    <section id="showcase" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">
            Perfect for Every Stream Type
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore music collections tailored to different streaming scenarios
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseItems.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300"
            >
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
