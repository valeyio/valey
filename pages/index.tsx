import Head from 'next/head'
import Image from 'next/image' // Import Image for placeholders
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatedText } from '@/components/AnimatedText'
import { AnimatedTagline } from '@/components/AnimatedTagline'
import { OnboardingModal } from '@/components/OnboardingModal'
import { useAuth } from '@/lib/AuthContext'

// Placeholder Icon Component (can be shared)
const FeatureIcon = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10',
      className
    )}
  >
    <div className="h-8 w-8 rounded-sm bg-brand-primary"></div>{' '}
    {/* Simple shape */}
  </div>
)

// Placeholder Image Component
const ImagePlaceholder = ({
  aspectRatio = '16/9',
}: {
  aspectRatio?: string
}) => (
  <div
    style={{ paddingBottom: `calc(100% / (${aspectRatio}))` }}
    className="relative w-full overflow-hidden rounded-lg bg-gray-200"
  >
    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
      {/* Optional: Add text or simple icon */}
      <span>Placeholder Image</span>
    </div>
  </div>
)

export default function Home() {
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalView, setModalView] = useState<'signup' | 'login'>('signup')
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard/app')
    }
  }, [user, isLoading, router])

  // Handler function for Get Started button
  const openSignupModal = () => {
    setModalView('signup')
    setModalOpen(true)
  }

  // Handler for Login button
  const openLoginModal = () => {
    setModalView('login')
    setModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#FAD92D]"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Head>
        <title>Valey - Built for the BOLD</title>
        <meta
          name="description"
          content="Valey helps founders and operators escape the chaos of doing it all, embedding world-class offshore talent into your team."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="flex-grow">
        {/* Hero Section - Image perfectly aligned with bottom */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary/90 via-brand-primary/70 to-white">
          {/* Background Hero Image - Full width and height */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-image.png"
              alt="Valey Hero"
              fill
              className="object-contain object-right-bottom md:object-right md:pt-12"
              priority
            />
          </div>

          {/* Content area with text overlaying the image */}
          <div className="relative z-10 pb-[250px] pt-12 md:pb-[300px] md:pt-24 lg:pt-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="md:grid md:grid-cols-12 md:gap-8">
                {/* Text Content */}
                <div className="md:col-span-5 lg:col-span-5">
                  <AnimatedTagline className="mb-6 text-left" />
                  <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                    Valey helps founders and operators escape the chaos of doing
                    it all. We embed world-class offshore talent into your team
                    — so you can delegate with clarity, build with focus, and
                    scale with freedom.
                  </p>
                  <div className="mt-8">
                    <Button
                      variant="brand"
                      size="lg"
                      className="shadow-xl transition-all duration-300 hover:shadow-2xl"
                      onClick={openSignupModal}
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: The Problem We Solve - Updated copy */}
        <section id="problem" className="bg-background py-16 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                You weren't meant to do it all.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Every founder reaches a point where doing everything yourself
                becomes the biggest obstacle to growth.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
              {/* Card 1 */}
              <div className="rounded-xl border border-border bg-card p-8 shadow-md">
                {/* Placeholder Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold">
                  Buried in Busywork
                </h3>
                <p className="text-muted-foreground">
                  You're buried in busywork instead of leading.
                </p>
              </div>
              {/* Card 2 */}
              <div className="rounded-xl border border-border bg-card p-8 shadow-md">
                {/* Placeholder Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <span className="text-2xl">🌪️</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold">Process Chaos</h3>
                <p className="text-muted-foreground">
                  Your team is overworked, your processes are messy.
                </p>
              </div>
              {/* Card 3 */}
              <div className="rounded-xl border border-border bg-card p-8 shadow-md">
                {/* Placeholder Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold">
                  Delegation Anxiety
                </h3>
                <p className="text-muted-foreground">
                  Delegation feels risky — so you hold onto everything.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: What We Do - Updated copy */}
        <section
          id="what-we-do"
          className="bg-gradient-to-r from-slate-50 via-brand-primary/5 to-slate-50 py-16 md:py-28"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                We embed talent. We build systems.
                <br />
                We unlock your potential.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Valey is not a staffing agency. We're your operational upgrade —
                placing elite team members from the Philippines directly into
                your workflow and supporting them with the structure and tools
                to thrive.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
              <div className="p-6 text-center">
                <FeatureIcon />
                <h3 className="mb-2 text-xl font-semibold">Embedded Teams</h3>
                <p className="text-muted-foreground">
                  Skilled, dedicated professionals integrated seamlessly into
                  your operations.
                </p>
              </div>
              <div className="p-6 text-center">
                <FeatureIcon />
                <h3 className="mb-2 text-xl font-semibold">Systems Setup</h3>
                <p className="text-muted-foreground">
                  We design and implement the workflows and tools for peak
                  efficiency.
                </p>
              </div>
              <div className="p-6 text-center">
                <FeatureIcon />
                <h3 className="mb-2 text-xl font-semibold">Ongoing Support</h3>
                <p className="text-muted-foreground">
                  Continuous management and optimization to ensure your team
                  thrives.
                </p>
              </div>
            </div>
            {/* Placeholder for a visual element */}
            <div className="mt-16">
              <ImagePlaceholder aspectRatio="21/9" />
            </div>
          </div>
        </section>

        {/* Section 4: How It Works - Updated copy */}
        <section id="how-it-works" className="bg-background py-16 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                From chaos to clarity — in 3 steps.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Our straightforward process gets your embedded team up and
                running quickly.
              </p>
            </div>
            {/* Steps Layout */}
            <div className="relative">
              {/* Connecting Line (optional visual element) */}
              <div
                className="absolute left-0 top-1/2 z-0 hidden h-0.5 w-full bg-border md:block"
                style={{ transform: 'translateY(-50%)' }}
              ></div>

              <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
                {/* Step 1 */}
                <div className="rounded-lg bg-card p-6 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-black ring-4 ring-background">
                    1
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    Meet your embedded operator
                  </h3>
                  <p className="text-muted-foreground">
                    We match you with the right embedded talent for your
                    specific needs.
                  </p>
                </div>
                {/* Step 2 */}
                <div className="rounded-lg bg-card p-6 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-black ring-4 ring-background">
                    2
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    Align your systems and workflows
                  </h3>
                  <p className="text-muted-foreground">
                    Collaboratively design and implement your streamlined
                    operational processes.
                  </p>
                </div>
                {/* Step 3 */}
                <div className="rounded-lg bg-card p-6 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-black ring-4 ring-background">
                    3
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    Scale with confidence and clarity
                  </h3>
                  <p className="text-muted-foreground">
                    Focus on growth while your embedded team handles the
                    day-to-day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Final CTA Banner - Updated copy */}
        <section
          id="start"
          className="relative overflow-hidden bg-gradient-to-r from-brand-primary via-yellow-300 to-brand-primary"
        >
          {/* Add decorative elements */}
          <div className="absolute left-0 top-0 h-full w-full opacity-10">
            <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white"></div>
            <div className="absolute bottom-10 right-10 h-20 w-20 rounded-full bg-white"></div>
          </div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-16 text-center md:py-24">
              <h2 className="text-3xl font-extrabold text-primary md:text-4xl">
                <span className="block">
                  Your next chapter starts with better delegation.
                </span>
              </h2>
              <p className="mt-5 text-lg leading-tight text-foreground/80 md:text-xl">
                We've been where you are — overwhelmed, stuck in the weeds,
                holding on too tight. Valey is the partner we wish we had. Let's
                build your next chapter, together.
              </p>
              <div className="mt-8 md:mt-10">
                <Button
                  size="lg"
                  variant="outline"
                  className="transform border-2 border-primary bg-white text-primary shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/80 hover:bg-gray-50"
                  onClick={openSignupModal}
                >
                  Get started for free
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Onboarding Modal */}
      <OnboardingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialView={modalView}
      />
    </div>
  )
}
