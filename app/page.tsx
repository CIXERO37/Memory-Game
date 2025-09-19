import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Play, Trophy, Sparkles } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Memory Quiz Game
            </h1>
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Test your memory with fun card games, then challenge your knowledge with exciting school-themed quizzes!
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Host a Game</CardTitle>
              <CardDescription className="text-base">
                Create a room and invite friends to join your quiz adventure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/host" className="block">
                <Button className="w-full text-lg py-6 font-semibold" size="lg">
                  Create Room
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-accent/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Play className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Join a Game</CardTitle>
              <CardDescription className="text-base">Enter a room code and start playing with others</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/join" className="block">
                <Button variant="secondary" className="w-full text-lg py-6 font-semibold" size="lg">
                  Join Room
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-8 text-foreground">Game Features</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-chart-1/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-chart-1" />
              </div>
              <h3 className="font-semibold mb-2">Memory Challenge</h3>
              <p className="text-sm text-muted-foreground">Complete fun memory card games before accessing quizzes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-chart-2/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Multiplayer</h3>
              <p className="text-sm text-muted-foreground">Play with friends in synchronized real-time sessions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-chart-3/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="font-semibold mb-2">Educational Quizzes</h3>
              <p className="text-sm text-muted-foreground">
                Learn with school-themed questions across various subjects
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
