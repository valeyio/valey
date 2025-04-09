import React, { ElementType } from 'react'
import { cn } from '@/lib/utils'

type AnimatedTextProps<T extends ElementType = 'div'> = {
  text: string
  variant?: 'fade' | 'typewriter' | 'slide' | 'bounce' | 'wave'
  className?: string
  speed?: 'slow' | 'medium' | 'fast'
  delay?: number
  repeat?: boolean
  as?: T
  staggerChildren?: boolean
}

export const AnimatedText = <T extends ElementType = 'div'>({
  text,
  variant = 'fade',
  className,
  speed = 'medium',
  delay = 0,
  repeat = false,
  as,
  staggerChildren = true,
}: AnimatedTextProps<T>) => {
  // Get animation duration based on speed
  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return '1s'
      case 'fast':
        return '0.3s'
      case 'medium':
      default:
        return '0.6s'
    }
  }

  const duration = getDuration()
  const Component = as || 'div'

  // Split text into characters or words depending on variant
  const splitText = () => {
    // For wave animation, split by character
    if (variant === 'wave') {
      return text.split('').map((char, index) => (
        <span
          key={index}
          className={cn('inline-block', `animated-text-${variant}-char`)}
          style={{
            animationDelay: staggerChildren
              ? `${delay + index * 0.05}s`
              : `${delay}s`,
            animationDuration: duration,
            animationIterationCount: repeat ? 'infinite' : '1',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))
    }

    // For other animations, split by word
    return text.split(' ').map((word, index) => (
      <span
        key={index}
        className={cn('inline-block', `animated-text-${variant}-word`)}
        style={{
          animationDelay: staggerChildren
            ? `${delay + index * 0.1}s`
            : `${delay}s`,
          animationDuration: duration,
          animationIterationCount: repeat ? 'infinite' : '1',
        }}
      >
        {word}
        {index !== text.split(' ').length - 1 && '\u00A0'}
      </span>
    ))
  }

  return (
    <Component
      className={cn('animated-text', `animated-text-${variant}`, className)}
    >
      {splitText()}
    </Component>
  )
}
