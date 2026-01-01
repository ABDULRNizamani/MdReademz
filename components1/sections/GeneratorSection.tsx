'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import OutputBox, { ReadmeVersion } from './OutputBox'
import FeaturesSection from './FeaturesSection'
import './GeneratorSection.css'

export default function GeneratorSection() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [readmeHistory, setReadmeHistory] = useState<ReadmeVersion[]>([])
  
  const [error, setError] = useState('')
  const [lastInput, setLastInput] = useState('')
  const [hasGitHubUrl, setHasGitHubUrl] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim()) return
    
    setHasSubmitted(true)
    setError('')
    setIsLoading(true)
    
    const userInput = input
    const githubUrlMatch = userInput.match(/github\.com\/([\w-]+)\/([\w.-]+)/)
    const currentHasUrl = !!githubUrlMatch
    
    setInput('')
    
    // Get the current README for iterations
    const currentReadme = readmeHistory.length > 0 ? readmeHistory[0].content : undefined
    
    const sessionContext = {
      hasGitHubUrl: currentHasUrl,
      isIteration: hasGitHubUrl && currentHasUrl && readmeHistory.length > 0,
      previousInput: lastInput,
      currentReadme: currentReadme  // ← FIXED: Added this!
    }

    try {
      const response = await fetch('/api/generate-readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userInput,
          sessionContext
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        setIsLoading(false)
        return
      }

      const newVersion: ReadmeVersion = {
        id: Date.now(),
        content: data.readme,
        timestamp: new Date(),
        input: userInput,
        repoName: data.repoName
      }

      setReadmeHistory(prev => {
        const updated = [newVersion, ...prev]
        return updated.slice(0, 2)
      })

      
      setLastInput(userInput)
      setHasGitHubUrl(currentHasUrl)
      setIsLoading(false)

    } catch (err) {
      console.error('Error:', err)  // ← Added console.log to see actual error
      setError('Failed to generate README. Please try again.')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClearHistory = () => {
    setReadmeHistory([])
    setHasSubmitted(false)
    setError('')
    setLastInput('')
    setHasGitHubUrl(false)
  }

  const hasOutput = isLoading || readmeHistory.length > 0

  return (
    <>
      <section className="generator-section" id="generator">
        <div className="generator-container">
          
          <div className="generator-header">
            <h2 className="generator-title">Generate Your README</h2>
            <p className="generator-subtitle">
              Paste your GitHub repository link or describe your project. Our AI will handle the rest.
            </p>
            <div className="title-underline"></div>
          </div>

          <div className={`input-wrapper ${hasSubmitted ? 'input-minimized' : ''}`}>
            <div className="input-group">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://github.com/username/repository"
                className="generator-input"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="send-button"
                size="icon"
              >
                <Send className="send-icon" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {hasSubmitted && (
            <OutputBox
              history={readmeHistory}
              isLoading={isLoading}
              
              onClearHistory={handleClearHistory}
            />
          )}
          
        </div>
      </section>

      <div id="features">
        <FeaturesSection hasOutput={hasOutput} />
      </div>
    </>
  )
}