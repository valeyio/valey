import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn('bg-primary text-primary-foreground py-12', className)}
    >
      <div className="container mx-auto grid grid-cols-1 items-center gap-8 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        {/* Logo Column */}
        <div className="flex justify-center md:justify-start">
          <Link href="/" className="flex items-center">
            {/* White version of the logo for dark background */}
            <div className="relative h-9 w-36">
              <Image
                src="/images/valey-logo-white.png"
                alt="Valey"
                fill
                className="object-contain object-left"
              />
            </div>
          </Link>
        </div>

        {/* Links Column */}
        <nav className="flex justify-center space-x-6 text-sm">
          <Link
            href="#problem"
            className="text-primary-foreground/70 transition-colors duration-300 hover:text-brand-primary"
          >
            Why Valey?
          </Link>
          <Link
            href="#how-it-works"
            className="text-primary-foreground/70 transition-colors duration-300 hover:text-brand-primary"
          >
            How It Works
          </Link>
          <Link
            href="#start"
            className="text-primary-foreground/70 transition-colors duration-300 hover:text-brand-primary"
          >
            Get Started
          </Link>
        </nav>

        {/* Copyright Column */}
        <div className="text-primary-foreground/60 text-center text-xs md:text-right">
          <p>© {new Date().getFullYear()} Valey. All rights reserved.</p>
          <p className="mt-1">Built for founders, operators, and doers.</p>
          <p className="mt-1">
            Designed to help you reclaim your time and scale what matters.
          </p>
        </div>
      </div>
    </footer>
  )
}
