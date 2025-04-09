import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedTaglineProps {
  className?: string
  staticText?: string
  animatedWords?: string[]
  underlineColor?: string
  underlineDuration?: number
  wordChangeDuration?: number
}

export const AnimatedTagline: React.FC<AnimatedTaglineProps> = ({
  className,
  staticText = 'Built for the',
  animatedWords = ['BOLD.', 'DISRUPTORS.', 'FOUNDERS.', 'OPERATORS.'],
  underlineColor = '#FAD92D',
  underlineDuration = 1, // seconds
  wordChangeDuration = 4, // seconds
}) => {
  const [wordIndex, setWordIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  const [isUnderlineAnimating, setIsUnderlineAnimating] = useState(true)
  const [key, setKey] = useState(0) // Used to force re-render of animations

  // Change word on interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      // First hide underline
      setIsUnderlineAnimating(false)

      // Then fade out the word
      setTimeout(() => {
        setIsAnimating(false)

        // Change word after fade out
        setTimeout(() => {
          setWordIndex((prevIndex) => (prevIndex + 1) % animatedWords.length)
          setKey((prev) => prev + 1)
          setIsAnimating(true)

          // Show underline after word appears
          setTimeout(() => {
            setIsUnderlineAnimating(true)
          }, 300)
        }, 600) // 600ms for word fade out
      }, 200) // 200ms for underline to disappear
    }, wordChangeDuration * 1000)

    return () => clearInterval(intervalId)
  }, [animatedWords.length, wordChangeDuration])

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Desktop layout - Words to the right of "Built for the" */}
      <div className="hidden md:block">
        <h1 className="flex items-baseline whitespace-nowrap text-4xl font-extrabold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="text-foreground mr-4 inline-block">
            {staticText}
          </span>
          <div className="relative inline-block">
            {/* Animated word */}
            <span
              key={`lg-${key}`}
              className={cn(
                'text-primary duration-600 font-extrabold transition-opacity',
                isAnimating ? 'opacity-100' : 'opacity-0'
              )}
            >
              {animatedWords[wordIndex]}
            </span>

            {/* Animated underline - width dynamically set to match word length */}
            <div
              key={`lg-underline-${key}`}
              className="absolute -bottom-1 h-3 bg-brand-primary"
              style={{
                width: isUnderlineAnimating ? '100%' : '0%',
                transition: `width ${underlineDuration}s cubic-bezier(0.19, 1, 0.22, 1)`,
                opacity: isUnderlineAnimating ? 1 : 0,
              }}
            />
          </div>
        </h1>
      </div>

      {/* Mobile layout - stacked for better readability */}
      <div className="md:hidden">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tighter">
          <span className="text-foreground mb-2 block">{staticText}</span>
          <div className="relative inline-block">
            {/* Animated word */}
            <span
              key={`sm-${key}`}
              className={cn(
                'text-primary duration-600 font-extrabold transition-opacity',
                isAnimating ? 'opacity-100' : 'opacity-0'
              )}
            >
              {animatedWords[wordIndex]}
            </span>

            {/* Animated underline - width matches word length */}
            <div
              key={`sm-underline-${key}`}
              className="absolute -bottom-1 h-3 bg-brand-primary"
              style={{
                width: isUnderlineAnimating ? '100%' : '0%',
                transition: `width ${underlineDuration}s cubic-bezier(0.19, 1, 0.22, 1)`,
                opacity: isUnderlineAnimating ? 1 : 0,
                maxWidth: '100%',
              }}
            />
          </div>
        </h1>
      </div>
    </div>
  )
}
