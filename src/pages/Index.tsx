import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full opacity-30 float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-20">
          <div className="space-y-4">
            <Badge className="glass px-4 py-2 text-sm font-bold">
              🎮 Gaming-Inspired Web Experience
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black gradient-text tracking-tight">
              Level Up
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground/90">
              Your Web Presence
            </h2>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the future of interactive design with our gaming-inspired aesthetic. 
            Dark themes, glowing accents, and immersive experiences that captivate your audience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button className="btn-game px-8 py-4 text-lg">
              Start Your Journey
            </Button>
            <Button variant="ghost" className="glass px-8 py-4 text-lg hover:bg-secondary/20">
              Explore Features
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card className="card-game p-8 hover:transform hover:scale-105 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent2 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold">Precision Design</h3>
              <p className="text-muted-foreground">
                Pixel-perfect interfaces crafted with gaming precision and attention to detail.
              </p>
            </div>
          </Card>

          <Card className="card-game p-8 hover:transform hover:scale-105 transition-all duration-300 pulse-glow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent2 to-primary flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Optimized performance that loads faster than your favorite game.
              </p>
            </div>
          </Card>

          <Card className="card-game p-8 hover:transform hover:scale-105 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success to-accent flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold">Interactive Experience</h3>
              <p className="text-muted-foreground">
                Engage users with game-like interactions and smooth animations.
              </p>
            </div>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="text-center space-y-8">
          <h3 className="text-3xl font-bold">Level Up Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Performance", value: "99%" },
              { label: "User Engagement", value: "+300%" },
              { label: "Load Speed", value: "<1s" },
              { label: "Satisfaction", value: "5★" }
            ].map((stat, index) => (
              <div key={index} className="glass p-6 rounded-lg space-y-2">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20 space-y-6">
          <h4 className="text-2xl font-bold">Ready to Play?</h4>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of developers and designers who've leveled up their web experiences 
            with our gaming-inspired design system.
          </p>
          <Button className="btn-game px-12 py-6 text-xl">
            Begin Adventure
          </Button>
        </div>
      </div>

      {/* Corner Badge */}
      <div className="fixed bottom-4 right-4 glass px-4 py-2 rounded-full text-sm opacity-80">
        © 2024 • Built with Gaming Aesthetics
      </div>
    </div>
  );
};

export default Index;
