import { useState } from 'react'

export default function AskValeyAI() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAskValey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    try {
      console.log('Query submitted:', query)
      // This is a placeholder for the future OpenAI integration
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    } catch (error) {
      console.error('Error asking Valey AI:', error)
    } finally {
      setIsLoading(false)
      setQuery('')
    }
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-md">
      <h3 className="mb-4 text-xl font-semibold text-white">Ask Valey AI</h3>
      <form onSubmit={handleAskValey} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Valey AI anything..."
            className="w-full rounded-md bg-gray-700 px-4 py-2 text-gray-100 placeholder-gray-400 focus:border-[#FAD92D] focus:outline-none focus:ring-2 focus:ring-[#FAD92D]/50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`w-full rounded-md bg-[#FAD92D] px-4 py-2 font-medium text-gray-900 shadow-md transition-colors ${
            isLoading || !query.trim()
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-[#FAD92D]/90'
          }`}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
