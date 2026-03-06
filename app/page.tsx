'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Film, Heart, Users, Popcorn, MessageCircle, MapPin, Star, Sparkles, ChevronRight, Loader2 } from 'lucide-react'

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = ref.current?.querySelectorAll('.scroll-animate')
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return ref
}

export default function HomePage() {
  const scrollRef = useScrollAnimation()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    fetch('/api/users/me')
      .then((res) => {
        if (res.ok) {
          // User is logged in, redirect to discover
          router.replace('/discover')
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        setChecking(false)
      })
  }, [router])

  // Show loading while checking auth
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600/95 via-pink-500/95 to-orange-400/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            ScreenDate
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-purple-600 hover:bg-white/90 hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-900/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Find your perfect movie partner</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Swipe. Match.<br />
              <span className="text-yellow-300">Watch Together.</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-10 max-w-lg mx-auto">
              Find someone in your city who wants to watch the same movie as you
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-yellow-300 hover:text-purple-700 hover:scale-105 transition-all duration-200 text-lg px-8 shadow-xl shadow-purple-900/30">
                  Get Started Free
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-200 text-lg px-8"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 scroll-animate opacity-0 translate-y-8 transition-all duration-700">
            See It In Action
          </h2>
          <p className="text-gray-600 text-center mb-12 scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            Swipe through movies, discover matches, and start chatting
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Phone Mockup 1 - Movie Swipe */}
            <div className="scroll-animate opacity-0 -translate-x-12 transition-all duration-700 delay-200">
              <div className="w-64 h-[500px] bg-gradient-to-br from-purple-600 to-pink-500 rounded-[3rem] p-3 shadow-2xl shadow-purple-500/30 rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-4 flex flex-col">
                  <div className="text-white text-sm font-medium text-center mb-3">Select Movies</div>
                  <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden relative">
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
                      <span className="text-2xl">✕</span>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Mockup 2 - Profile Match */}
            <div className="scroll-animate opacity-0 translate-y-12 transition-all duration-700 delay-300">
              <div className="w-72 h-[540px] bg-gradient-to-br from-pink-500 to-orange-400 rounded-[3rem] p-3 shadow-2xl shadow-pink-500/30 z-10">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-4 flex flex-col">
                  <div className="text-white text-sm font-medium text-center mb-3">Discover Partners</div>
                  <div className="flex-1 bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-4xl">
                        👤
                      </div>
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
                      <span className="text-2xl">✕</span>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Mockup 3 - Chat */}
            <div className="scroll-animate opacity-0 translate-x-12 transition-all duration-700 delay-400">
              <div className="w-64 h-[500px] bg-gradient-to-br from-orange-400 to-yellow-400 rounded-[3rem] p-3 shadow-2xl shadow-orange-500/30 rotate-[6deg] hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] p-4 flex flex-col">
                  <div className="text-white text-sm font-medium text-center mb-3">Chat & Plan</div>
                  <div className="flex-1 bg-gray-800 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
                    <div className="self-start bg-purple-600 text-white text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                      Hey! Excited for Dune! 🎬
                    </div>
                    <div className="self-end bg-pink-500 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">
                      Me too! IMAX showing?
                    </div>
                    <div className="self-start bg-purple-600 text-white text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                      Perfect! Saturday 7pm?
                    </div>
                    <div className="self-end bg-pink-500 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">
                      It&apos;s a date! 🍿
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-gray-400 text-sm">
                      Type a message...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 scroll-animate opacity-0 translate-y-8 transition-all duration-700">
            Why ScreenDate?
          </h2>
          <p className="text-gray-600 text-center mb-12 scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            The smartest way to find someone to go to the movies with
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-150 group">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-2 border border-purple-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Popcorn className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Select Movies</h3>
                <p className="text-gray-600">
                  Browse now-playing movies and pick the ones you&apos;re excited to watch
                </p>
              </div>
            </div>

            <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-200 group">
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-2 border border-pink-100">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Local Matches</h3>
                <p className="text-gray-600">
                  Connect with movie lovers in your city who share your taste
                </p>
              </div>
            </div>

            <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-250 group">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-2 border border-orange-100">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Chat & Plan</h3>
                <p className="text-gray-600">
                  Match, chat, and plan your cinema date together
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white scroll-animate opacity-0 translate-y-8 transition-all duration-700">
            How It Works
          </h2>
          <p className="text-gray-400 text-center mb-12 scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            Four simple steps to your next movie date
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { num: 1, title: 'Create Your Profile', desc: 'Sign up, add your city, and set your preferences', icon: Users },
              { num: 2, title: 'Select Movies', desc: 'Browse now-playing films and like the ones you want to see', icon: Film },
              { num: 3, title: 'Discover & Match', desc: 'Swipe through profiles of people with common movie interests', icon: Heart },
              { num: 4, title: 'Chat & Meet', desc: 'When you both like each other, plan your movie outing!', icon: MessageCircle },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`scroll-animate opacity-0 translate-y-8 transition-all duration-700`}
                style={{ transitionDelay: `${150 + i * 100}ms` }}
              >
                <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 scroll-animate opacity-0 translate-y-8 transition-all duration-700">
            Love Stories Start Here
          </h2>
          <p className="text-gray-600 text-center mb-12 scroll-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            Real matches, real connections
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah & Mike',
                location: 'New York',
                quote: 'We both swiped right on Dune and now we watch every sci-fi movie together!',
                avatar: '👫',
              },
              {
                name: 'Emma & James',
                location: 'Los Angeles',
                quote: 'Found my cinema buddy on ScreenDate. Now we never miss a Marvel premiere!',
                avatar: '💑',
              },
              {
                name: 'Alex & Sam',
                location: 'Chicago',
                quote: 'What started as movie dates turned into something beautiful. Thank you ScreenDate!',
                avatar: '❤️',
              },
            ].map((testimonial, i) => (
              <div
                key={testimonial.name}
                className={`scroll-animate opacity-0 translate-y-8 transition-all duration-700`}
                style={{ transitionDelay: `${150 + i * 100}ms` }}
              >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-shadow duration-300">
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
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl scroll-animate opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Movie Partner?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join thousands of movie lovers finding their perfect cinema companion
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-yellow-300 hover:text-purple-700 hover:scale-105 transition-all duration-200 text-lg px-10 py-6 shadow-xl shadow-purple-900/30">
              Join Now — It&apos;s Free
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <p className="text-white/60 mt-4 text-sm">
            No credit card required • Free forever
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-4">
            <Film className="w-5 h-5" />
            ScreenDate
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 ScreenDate. Made with ❤️ for movie lovers.
          </p>
        </div>
      </footer>

      {/* Animation styles */}
      <style jsx global>{`
        .scroll-animate.animate-in {
          opacity: 1 !important;
          transform: translate(0, 0) rotate(0) !important;
        }
      `}</style>
    </div>
  )
}
