import Link from 'next/link'
import { ArrowRight, BookOpen, Sparkles, Bookmark, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonalizedFeed } from '@/components/recommendations/personalized-feed'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
              Discover articles that
              <span className="text-primary"> inspire you</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto text-pretty">
              A personalized reading experience powered by intelligent recommendations. 
              The more you read, the better we understand what inspires you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/articles" className="gap-2">
                  <BookOpen className="h-5 w-5" />
                  Browse Articles
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/register" className="gap-2">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-muted-foreground text-sm">
                Our TF-IDF algorithm learns your preferences and suggests articles you&apos;ll love.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Save for Later</h3>
              <p className="text-muted-foreground text-sm">
                Bookmark articles to build your personal reading list and never lose an inspiration.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground text-sm">
                Your reading history helps us understand what matters most to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PersonalizedFeed limit={6} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get inspired?</h2>
            <p className="text-muted-foreground mb-8">
              Start reading now - no account required. Create an account to sync your bookmarks and history across devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/articles">
                  Explore Articles
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/register">
                  Create Free Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
