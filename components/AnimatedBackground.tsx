import React from 'react'
import { cn } from '@/lib/utils'

type AnimatedBackgroundProps = {
  variant?: 'bubbles' | 'squares' | 'particles'
  className?: string
  density?: 'low' | 'medium' | 'high'
  speed?: 'slow' | 'medium' | 'fast'
  color?: string
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'bubbles',
  className,
  density = 'medium',
  speed = 'medium',
  color = 'currentColor',
}) => {
  // Get the number of elements based on density
  const getCount = () => {
    switch (density) {
      case 'low':
        return 5
      case 'high':
        return 15
      case 'medium':
      default:
        return 10
    }
  }

  // Get animation duration based on speed
  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return '20s'
      case 'fast':
        return '8s'
      case 'medium':
      default:
        return '15s'
    }
  }

  const count = getCount()
  const duration = getDuration()
  const elements = Array.from({ length: count }).map((_, i) => i)

  const renderElements = () => {
    switch (variant) {
      case 'squares':
        return elements.map((i) => (
          <div
            key={i}
            className="absolute rounded-md bg-white opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: duration,
            }}
          />
        ))
      case 'particles':
        return elements.map((i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: duration,
            }}
          />
        ))
      case 'bubbles':
      default:
        return elements.map((i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${30 + Math.random() * 80}px`,
              height: `${30 + Math.random() * 80}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: duration,
            }}
          />
        ))
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
    >
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100%)
              ${variant === 'squares' ? 'rotate(0deg)' : ''};
            opacity: 0.1;
          }
          50% {
            opacity: ${variant === 'particles' ? 0.5 : 0.2};
          }
          100% {
            transform: translateY(-100px)
              ${variant === 'squares' ? 'rotate(360deg)' : ''};
            opacity: 0;
          }
        }
        div > div {
          animation-name: float-up;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
      {renderElements()}
    </div>
  )
}
