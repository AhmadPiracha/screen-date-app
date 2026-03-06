'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Film, Heart, Users, Popcorn, MessageCircle, MapPin, Star, Sparkles, ChevronRight, Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch('/api/users/me', { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeout)
        if (res.ok) {
          router.replace('/discover')
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        clearTimeout(timeout)
        setChecking(false)
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-600">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-purple-600 font-bold text-xl">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            ScreenDate
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-purple-600">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-purple-600 pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Find your perfect movie partner</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Swipe. Match.<br />
              <span className="text-purple-200">Watch Together.</span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-lg mx-auto">
              Find someone in your city who wants to watch the same movie as you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-yellow-300 hover:text-purple-700 hover:scale-105 transition-all duration-200 text-lg px-8 shadow-xl shadow-purple-900/30">
                  Get Started Free
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-200 text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-white/90">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">5K+</div>
                <div className="text-sm text-white/70">Matches Made</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-white/70">Cities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Screenshots Section */}
      <div className="bg-gray-50 py-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">See It In Action</h2>
          <p className="text-gray-600 text-center mb-12">Swipe through movies, discover matches, and start chatting</p>

          <div className="hidden md:flex flex-col md:flex-row items-center justify-center gap-8">
            <div>
              <div className="w-64 h-[500px] bg-purple-600 rounded-[3rem] p-3 shadow-2xl shadow-purple-300 rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-4 flex flex-col">
                  <div className="text-white text-sm font-medium text-center mb-3">Select Movies</div>
                  <div className="flex-1 bg-gray-800 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="text-lg font-bold">Dune: Part Three</div>
                      <div className="text-sm text-gray-300 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 8.9
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-2xl">&#x2715;</span>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="w-72 h-[540px] bg-purple-700 rounded-[3rem] p-3 shadow-2xl shadow-purple-300 z-10">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-4 flex flex-col">
                  <div className="text-white text-sm font-medium text-center mb-3">Discover Partners</div>
                  <div className="flex-1 bg-purple-900 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center text-4xl">&#128100;</div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                      <div className="text-xl font-bold">Sarah, 26</div>
                      <div className="text-sm text-gray-300">New York City</div>
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs">Dune</span>
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs">Sci-Fi</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-2xl">&#x2715;</span>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="w-64 h-[500px] bg-purple-500 rounded-[3rem] p-3 shadow-2xl shadow-purple-300 rotate-[6deg] hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-4 flex flex-col">
                  <div className="text-white text-sm font-medium text-center mb-3">Chat &amp; Plan</div>
                  <div className="flex-1 bg-gray-800 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
                    <div className="self-start bg-purple-600 text-white text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">Hey! Excited for Dune! &#127916;</div>
                    <div className="self-end bg-purple-400 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">Me too! IMAX showing?</div>
                    <div className="self-start bg-purple-600 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">Perfect! Saturday 7pm?</div>
                    <div className="self-end bg-purple-400 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">It&apos;s a date! &#127871;</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-gray-400 text-sm">Type a message...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only single mockup */}
          <div className="md:hidden flex justify-center">
            <div className="w-56 h-[400px] bg-purple-700 rounded-[2.5rem] p-2 shadow-2xl shadow-purple-300">
              <div className="w-full h-full bg-gray-900 rounded-[2rem] p-3 flex flex-col">
                <div className="text-white text-sm font-medium text-center mb-2">Discover Partners</div>
                <div className="flex-1 bg-purple-900 rounded-xl overflow-hidden relative flex items-center justify-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-3xl">&#128100;</div>
                </div>
                <div className="text-white text-center mt-2">
                  <div className="font-bold">Sarah, 26</div>
                  <div className="text-xs text-gray-400">New York City</div>
                </div>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-lg">&#x2715;</div>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-lg">&#128156;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why ScreenDate?</h2>
          <p className="text-gray-600 text-center mb-12">The smartest way to find someone to go to the movies with</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <div className="bg-white rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Popcorn className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Select Movies</h3>
                <p className="text-gray-600">Browse now-playing movies and pick the ones you&apos;re excited to watch</p>
              </div>
            </div>
            <div className="group">
              <div className="bg-white rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Local Matches</h3>
                <p className="text-gray-600">Connect with movie lovers in your city who share your taste</p>
              </div>
            </div>
            <div className="group">
              <div className="bg-white rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="w-16 h-16 bg-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Chat &amp; Plan</h3>
                <p className="text-gray-600">Match, chat, and plan your cinema date together</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-900 py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">How It Works</h2>
          <p className="text-gray-400 text-center mb-12">Four simple steps to your next movie date</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { num: 1, title: 'Create Your Profile', desc: 'Sign up, add your city, and set your preferences', icon: Users },
              { num: 2, title: 'Select Movies', desc: 'Browse now-playing films and like the ones you want to see', icon: Film },
              { num: 3, title: 'Discover & Match', desc: 'Swipe through profiles of people with common movie interests', icon: Heart },
              { num: 4, title: 'Chat & Meet', desc: 'When you both like each other, plan your movie outing!', icon: MessageCircle },
            ].map((step) => (
              <div key={step.num}>
                <div className="flex items-start gap-4 bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-white">{step.title}</h3>
                    <p className="text-gray-400">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Love Stories Start Here</h2>
          <p className="text-gray-600 text-center mb-12">Real matches, real connections</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah & Mike', location: 'New York', quote: 'We both swiped right on Dune and now we watch every sci-fi movie together!', avatar: '👫' },
              { name: 'Emma & James', location: 'Los Angeles', quote: 'Found my cinema buddy on ScreenDate. Now we never miss a Marvel premiere!', avatar: '💑' },
              { name: 'Alex & Sam', location: 'Chicago', quote: 'What started as movie dates turned into something beautiful. Thank you ScreenDate!', avatar: '❤️' },
            ].map((testimonial) => (
              <div key={testimonial.name}>
                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="text-4xl mb-4">{testimonial.avatar}</div>
                  <p className="text-gray-700 mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-purple-600 py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Find Your Movie Partner?</h2>
          <p className="text-white/80 mb-8 text-lg">Join thousands of movie lovers finding their perfect cinema companion</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-yellow-300 hover:text-purple-700 hover:scale-105 transition-all duration-200 text-lg px-10 py-6 shadow-xl shadow-purple-900/30">
              Join Now - It&apos;s Free
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <p className="text-white/60 mt-4 text-sm">No credit card required - Free forever</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-4">
            <Film className="w-5 h-5" />
            ScreenDate
          </div>
          <p className="text-gray-500 text-sm">&#169; 2026 ScreenDate. Made with love for movie lovers.</p>
        </div>
      </footer>
    </div>
  )
}
