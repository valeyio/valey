import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Cal, { getCalApi } from '@calcom/embed-react'
import { useAuth } from '@/lib/AuthContext'

// Quotes for the right side
const quotes = [
  {
    text: 'Deciding what not to do is as important as deciding what to do.',
    author: 'Steve Jobs',
  },
  {
    text: 'If you want to go fast, go alone. If you want to go far, go together.',
    author: 'African Proverb',
  },
  {
    text: 'A leader is best when people barely know he exists… when his work is done, his aim fulfilled, they will say: we did it ourselves.',
    author: 'Lao Tzu',
  },
  {
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
  },
  {
    text: "It's not the daily increase but daily decrease. Hack away at the unessential.",
    author: 'Bruce Lee',
  },
  {
    text: "Don't find fault, find a remedy.",
    author: 'Henry Ford',
  },
]

type OnboardingProps = {
  onClose: () => void
  initialView?: 'signup' | 'login'
}

export function Onboarding({
  onClose,
  initialView = 'signup',
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [view, setView] = useState<'signup' | 'login'>(initialView)
  const [currentQuote, setCurrentQuote] = useState(0)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    delegationClarity: '',
    referralSource: '',
    phoneNumber: '',
  })

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Rotate quotes periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize Cal.com
  useEffect(() => {
    if (currentStep === 3) {
      ;(async function () {
        const cal = await getCalApi({ namespace: 'alignmentcall' })
        cal('ui', { hideEventTypeDetails: false, layout: 'month_view' })
      })()
    }
  }, [currentStep])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (view === 'signup') {
      // Handle signup form submission
      if (currentStep === 1) {
        handleNext()
      } else if (currentStep === 2) {
        handleNext()
      } else if (currentStep === 3) {
        // For now, we just keep the form open with the calendar
        // Actual signup will be handled later
        console.log('Form data collected:', formData)
      }
    } else {
      // Handle login form submission
      try {
        setIsLoading(true)
        const { error } = await signIn(loginEmail, loginPassword)

        if (error) {
          throw error
        }

        // Redirect to dashboard on successful login
        router.push('/dashboard/app')
        onClose()
      } catch (error: any) {
        setErrorMessage(error.message || 'Invalid email or password')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const toggleView = () => {
    setView((prev) => (prev === 'signup' ? 'login' : 'signup'))
    setCurrentStep(1) // Reset step when toggling views
    setErrorMessage('') // Clear any error messages
  }

  // Form content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="mb-6">
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                required
              />
            </div>
            <Button
              variant="brand"
              className="w-full py-6"
              onClick={handleNext}
              disabled={!formData.fullName || !formData.email}
            >
              Get Started
            </Button>
          </>
        )
      case 2:
        return (
          <>
            <div className="mb-5">
              <label
                htmlFor="companyName"
                className="mb-2 block text-sm font-medium"
              >
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                required
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="delegationClarity"
                className="mb-2 block text-sm font-medium"
              >
                How clear are you on what you'd like to delegate first?
              </label>
              <select
                id="delegationClarity"
                name="delegationClarity"
                value={formData.delegationClarity}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                required
              >
                <option value="">Select an option</option>
                <option value="clear">
                  I've got a few ideas. I just need the right person to take
                  them on.
                </option>
                <option value="somewhat">
                  I have a rough idea, but need help mapping it out.
                </option>
                <option value="unclear">
                  Not sure yet. I could use some help figuring that out.
                </option>
              </select>
            </div>
            <div className="mb-5">
              <label
                htmlFor="referralSource"
                className="mb-2 block text-sm font-medium"
              >
                How did you hear about us?
              </label>
              <input
                type="text"
                id="referralSource"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-medium"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>

            <Button
              variant="brand"
              className="w-full py-6"
              onClick={handleNext}
              disabled={!formData.companyName || !formData.delegationClarity}
            >
              Next
            </Button>
          </>
        )
      case 3:
        return (
          <div className="h-full">
            <p className="mb-8 text-center text-gray-600">
              Let's discuss what you need. Book a time that works for you:
            </p>
            <div className="mx-auto h-[300px] w-full">
              <Cal
                namespace="alignmentcall"
                calLink="team/valey/alignmentcall"
                style={{ width: '100%', height: '100%', overflow: 'scroll' }}
                config={{ layout: 'month_view' }}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderLoginForm = () => {
    return (
      <>
        <div className="mb-6">
          <label
            htmlFor="loginEmail"
            className="mb-2 block text-sm font-medium"
          >
            Email Address
          </label>
          <input
            type="email"
            id="loginEmail"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="loginPassword"
            className="mb-2 block text-sm font-medium"
          >
            Password
          </label>
          <input
            type="password"
            id="loginPassword"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            required
          />
        </div>
        <Button
          variant="brand"
          className="w-full py-6"
          type="submit"
          disabled={isLoading || !loginEmail || !loginPassword}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>
      </>
    )
  }

  return (
    <div className="flex h-[600px] max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl">
      {/* Close button (X) */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Content container with animation */}
      <div className="flex w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ x: view === 'signup' ? -50 : 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: view === 'signup' ? 50 : -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex w-full"
          >
            {/* Left side: Form */}
            <div className="flex w-full flex-col justify-between bg-white p-8 md:w-1/2">
              <div>
                <h2 className="mb-6 text-2xl font-bold">
                  {view === 'signup'
                    ? `Step ${currentStep} of 3: ${currentStep === 1 ? 'Get Started' : currentStep === 2 ? 'Tell Us More' : 'Schedule a Call'}`
                    : 'Log In to Your Account'}
                </h2>

                {/* Error message display */}
                {errorMessage && (
                  <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {view === 'signup' ? renderStepContent() : renderLoginForm()}
                </form>
              </div>

              {/* Toggle between signup and login */}
              <div className="mt-6 text-center text-sm">
                {view === 'signup' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={toggleView}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      Log in here
                    </button>
                  </p>
                ) : (
                  <p>
                    Not signed up yet?{' '}
                    <button
                      onClick={toggleView}
                      className="font-semibold text-brand-primary hover:underline"
                    >
                      Get Started here
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Image and quote */}
            <div className="relative hidden w-1/2 md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/70 to-black/90">
                <Image
                  src="/images/hero-image.png"
                  alt="Valey Hero"
                  fill
                  className="object-cover opacity-60"
                  priority
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>

              {/* Quote overlay */}
              <div className="absolute inset-0 flex items-center justify-center p-10">
                <div className="rounded-lg bg-black/20 p-6 backdrop-blur-sm">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuote}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="text-center"
                    >
                      <p className="mb-4 text-xl font-medium italic text-white">
                        "{quotes[currentQuote].text}"
                      </p>
                      <p className="text-white/80">
                        — {quotes[currentQuote].author}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
