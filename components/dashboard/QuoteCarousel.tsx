import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/useSupabase'

type Quote = {
  id: string
  text: string
  author: string
}

// Mock quotes since we're bypassing Supabase for now
const mockQuotes: Quote[] = [
  {
    id: '1',
    text: 'Deciding what not to do is as important as deciding what to do.',
    author: 'Steve Jobs',
  },
  {
    id: '2',
    text: 'If you want to go fast, go alone. If you want to go far, go together.',
    author: 'African Proverb',
  },
  {
    id: '3',
    text: 'A leader is best when people barely know he exists… they will say: we did it ourselves.',
    author: 'Lao Tzu',
  },
  {
    id: '4',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
  },
  {
    id: '5',
    text: "It's not the daily increase but daily decrease. Hack away at the unessential.",
    author: 'Bruce Lee',
  },
  {
    id: '6',
    text: "Don't find fault, find a remedy.",
    author: 'Henry Ford',
  },
  {
    id: '7',
    text: "You weren't built to do everything. You were built to build.",
    author: 'Unknown',
  },
  {
    id: '8',
    text: 'Focus is saying no to good ideas.',
    author: 'Steve Jobs',
  },
  {
    id: '9',
    text: "Great things in business are never done by one person. They're done by a team.",
    author: 'Steve Jobs',
  },
  {
    id: '10',
    text: 'Productivity is never an accident. It is always the result of commitment to excellence.',
    author: 'Paul J. Meyer',
  },
]

export default function QuoteCarousel() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchQuotes = async () => {
      setIsLoading(true)
      try {
        // Instead of Supabase, use our mock quotes
        setQuotes(mockQuotes)
      } catch (error) {
        console.error('Error fetching quotes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  useEffect(() => {
    if (quotes.length === 0) return

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [quotes])

  if (isLoading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-md">
        <div className="h-24 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-gray-700"></div>
          <div className="mt-4 h-4 w-1/2 rounded bg-gray-700"></div>
        </div>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-md">
        <p className="text-gray-300">No quotes available at the moment.</p>
      </div>
    )
  }

  const currentQuote = quotes[currentQuoteIndex]

  return (
    <div className="min-h-[150px] rounded-lg bg-gray-800 p-6 shadow-md">
      <div className="animate-fade-in">
        <p className="mb-4 text-lg font-semibold leading-relaxed text-white">
          "{currentQuote.text}"
        </p>
        <p className="text-right text-sm text-[#FAD92D]">
          — {currentQuote.author}
        </p>
      </div>

      <div className="mt-4 flex justify-center space-x-1">
        {quotes.map((_, index) => (
          <span
            key={index}
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              index === currentQuoteIndex ? 'bg-[#FAD92D]' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Add this to your globals.css
// @keyframes fadeIn {
//   0% { opacity: 0; }
//   100% { opacity: 1; }
// }
//
// .animate-fade-in {
//   animation: fadeIn 1s ease-in-out;
// }
