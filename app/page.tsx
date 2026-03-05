import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Film, Heart, Users, Popcorn, MessageCircle, MapPin } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 pb-20">
        <div className="text-center text-white">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Film className="w-10 h-10" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ScreenDate
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-md mx-auto">
            Find someone in your city who wants to watch the same movie as you
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-white/90">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Popcorn className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select Movies</h3>
            <p className="text-white/80 text-sm">
              Choose movies currently playing in theaters that you want to watch
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Same City Match</h3>
            <p className="text-white/80 text-sm">
              Find movie enthusiasts in your city with similar taste
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chat & Plan</h3>
            <p className="text-white/80 text-sm">
              Match, chat, and plan your movie date together
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Create Your Profile</h3>
                <p className="text-gray-600">
                  Sign up with your email, add your city, and tell us your movie preferences
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Select Movies</h3>
                <p className="text-gray-600">
                  Browse now-playing movies and select ones you want to watch at the cinema
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Discover & Match</h3>
                <p className="text-gray-600">
                  Swipe through profiles of people in your city with common movie interests
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Chat & Meet</h3>
                <p className="text-gray-600">
                  When you both like each other, chat and plan your movie outing!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Ready to find your movie partner?
        </h2>
        <Link href="/signup">
          <Button size="lg" className="bg-purple-500 hover:bg-purple-600">
            Join Now — It&apos;s Free
          </Button>
        </Link>
        <p className="text-gray-400 mt-4 text-sm">
          No credit card required
        </p>
      </div>
    </div>
  )
}
