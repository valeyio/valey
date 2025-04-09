import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OnboardingModal } from '@/components/OnboardingModal'

export function Navbar({ className }: { className?: string }) {
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalView, setModalView] = useState<'signup' | 'login'>('signup')

  // Handler functions
  const openSignupModal = () => {
    setModalView('signup')
    setModalOpen(true)
  }

  const openLoginModal = () => {
    setModalView('login')
    setModalOpen(true)
  }

  return (
    <>
      <header
        className={cn(
          'border-border/40 bg-background/90 sticky top-0 z-50 w-full border-b shadow-sm backdrop-blur-sm',
          className
        )}
      >
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="mr-8 flex">
            <Link href="/" className="flex items-center">
              {/* Icon logo - visible only on mobile */}
              <div className="relative h-10 w-10 sm:hidden">
                <Image
                  src="/images/valey-icon.png"
                  alt="Valey Icon"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Text logo - visible on all screens except mobile, increased size */}
              <div className="relative hidden h-10 w-40 sm:block">
                <Image
                  src="/images/valey-logo.png"
                  alt="Valey"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Navigation Links - Moved to the left */}
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            <Link
              href="/"
              className="text-foreground/60 hover:text-foreground/80 transition-colors"
            >
              Home
            </Link>
            <Link
              href="#problem" // Link to the 'Problem' section
              className="text-foreground/60 hover:text-foreground/80 transition-colors"
            >
              Why Valey?
            </Link>
            <Link
              href="#how-it-works" // Link to 'How it Works' section
              className="text-foreground/60 hover:text-foreground/80 transition-colors"
            >
              How It Works
            </Link>
          </nav>

          <div className="flex flex-1 items-center justify-end space-x-4">
            {/* Login Button - Converted to outlined button */}
            <Button
              variant="outline"
              size="sm"
              className="text-foreground/70 hover:text-foreground hidden border-brand-primary hover:bg-transparent md:inline-flex"
              onClick={openLoginModal}
            >
              Log in
            </Button>

            {/* Get Started Button */}
            <Button
              variant="brand"
              size="sm"
              className="hidden font-medium transition-all duration-300 hover:shadow-md md:inline-flex"
              onClick={openSignupModal}
            >
              Get started for free
            </Button>

            {/* Mobile Menu Button */}
            <button className="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary md:hidden">
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu - not implemented yet */}
      </header>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialView={modalView}
      />
    </>
  )
}
