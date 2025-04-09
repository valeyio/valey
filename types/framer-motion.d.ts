declare module 'framer-motion' {
  import {
    ForwardRefExoticComponent,
    RefAttributes,
    ReactNode,
    CSSProperties,
  } from 'react'

  export interface MotionProps {
    initial?: any
    animate?: any
    exit?: any
    transition?: any
    className?: string
    style?: CSSProperties
    children?: ReactNode
    key?: string | number
  }

  export interface AnimatePresenceProps {
    children?: ReactNode
    mode?: 'sync' | 'wait' | 'popLayout'
    initial?: boolean
    exitBeforeEnter?: boolean
    onExitComplete?: () => void
  }

  export const motion: {
    div: ForwardRefExoticComponent<MotionProps & RefAttributes<HTMLDivElement>>
    // Add other HTML elements as needed
  }

  export const AnimatePresence: React.FC<AnimatePresenceProps>
}

declare module 'framer-motion/dist/framer-motion' {
  export * from 'framer-motion'
}
